'''
Business: CRUD операции для записей времени в TimeTracker
Args: event - dict с httpMethod, headers (X-User-Id), body с данными записи
Returns: HTTP response с записями времени или результатом операции
'''

import json
import os
import psycopg
from datetime import datetime

def handler(event, context):
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers_dict = event.get('headers', {})
    user_id = headers_dict.get('X-User-Id') or headers_dict.get('x-user-id')
    
    if not user_id:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Unauthorized: X-User-Id header required'}),
            'isBase64Encoded': False
        }
    
    try:
        database_url = os.environ.get('DATABASE_URL')
        if not database_url:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Database configuration error'}),
                'isBase64Encoded': False
            }
        
        with psycopg.connect(database_url) as conn:
            with conn.cursor() as cur:
                if method == 'GET':
                    query_params = event.get('queryStringParameters') or {}
                    
                    cur.execute(f"SELECT role FROM users WHERE id = {user_id}")
                    user_role_row = cur.fetchone()
                    if not user_role_row:
                        return {
                            'statusCode': 404,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'error': 'User not found'}),
                            'isBase64Encoded': False
                        }
                    user_role = user_role_row[0]
                    
                    if user_role == 'admin':
                        query = '''
                            SELECT te.id, te.user_id, u.email, u.full_name, te.project_id, p.name as project_name,
                                   te.activity_id, a.name as activity_name, te.entry_date, te.hours, te.comment,
                                   te.created_at, te.updated_at
                            FROM time_entries te
                            JOIN users u ON te.user_id = u.id
                            JOIN projects p ON te.project_id = p.id
                            JOIN activities a ON te.activity_id = a.id
                            ORDER BY te.entry_date DESC, te.created_at DESC
                        '''
                    else:
                        query = f'''
                            SELECT te.id, te.user_id, u.email, u.full_name, te.project_id, p.name as project_name,
                                   te.activity_id, a.name as activity_name, te.entry_date, te.hours, te.comment,
                                   te.created_at, te.updated_at
                            FROM time_entries te
                            JOIN users u ON te.user_id = u.id
                            JOIN projects p ON te.project_id = p.id
                            JOIN activities a ON te.activity_id = a.id
                            WHERE te.user_id = {user_id}
                            ORDER BY te.entry_date DESC, te.created_at DESC
                        '''
                    
                    cur.execute(query)
                    rows = cur.fetchall()
                    
                    entries = []
                    for row in rows:
                        entries.append({
                            'id': row[0],
                            'user_id': row[1],
                            'user_email': row[2],
                            'user_name': row[3],
                            'project_id': row[4],
                            'project_name': row[5],
                            'activity_id': row[6],
                            'activity_name': row[7],
                            'entry_date': str(row[8]),
                            'hours': float(row[9]),
                            'comment': row[10],
                            'created_at': row[11].isoformat() if row[11] else None,
                            'updated_at': row[12].isoformat() if row[12] else None
                        })
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'entries': entries}),
                        'isBase64Encoded': False
                    }
                
                elif method == 'POST':
                    body = json.loads(event.get('body', '{}'))
                    project_id = body.get('project_id')
                    activity_id = body.get('activity_id')
                    entry_date = body.get('entry_date')
                    hours = body.get('hours')
                    comment = body.get('comment', '')
                    
                    if not all([project_id, activity_id, entry_date, hours]):
                        return {
                            'statusCode': 400,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'error': 'Missing required fields'}),
                            'isBase64Encoded': False
                        }
                    
                    insert_query = f'''
                        INSERT INTO time_entries (user_id, project_id, activity_id, entry_date, hours, comment)
                        VALUES ({user_id}, {project_id}, {activity_id}, '{entry_date}', {hours}, '{comment}')
                        RETURNING id
                    '''
                    cur.execute(insert_query)
                    new_id = cur.fetchone()[0]
                    conn.commit()
                    
                    return {
                        'statusCode': 201,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': True, 'id': new_id}),
                        'isBase64Encoded': False
                    }
                
                elif method == 'PUT':
                    body = json.loads(event.get('body', '{}'))
                    entry_id = body.get('id')
                    project_id = body.get('project_id')
                    activity_id = body.get('activity_id')
                    entry_date = body.get('entry_date')
                    hours = body.get('hours')
                    comment = body.get('comment', '')
                    
                    if not all([entry_id, project_id, activity_id, entry_date, hours]):
                        return {
                            'statusCode': 400,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'error': 'Missing required fields'}),
                            'isBase64Encoded': False
                        }
                    
                    cur.execute(f"SELECT user_id FROM time_entries WHERE id = {entry_id}")
                    owner_row = cur.fetchone()
                    if not owner_row or owner_row[0] != int(user_id):
                        return {
                            'statusCode': 403,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'error': 'Forbidden'}),
                            'isBase64Encoded': False
                        }
                    
                    update_query = f'''
                        UPDATE time_entries 
                        SET project_id = {project_id}, activity_id = {activity_id}, 
                            entry_date = '{entry_date}', hours = {hours}, comment = '{comment}',
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = {entry_id}
                    '''
                    cur.execute(update_query)
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': True}),
                        'isBase64Encoded': False
                    }
                
                elif method == 'DELETE':
                    query_params = event.get('queryStringParameters') or {}
                    entry_id = query_params.get('id')
                    
                    if not entry_id:
                        return {
                            'statusCode': 400,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'error': 'Missing entry id'}),
                            'isBase64Encoded': False
                        }
                    
                    cur.execute(f"SELECT user_id FROM time_entries WHERE id = {entry_id}")
                    owner_row = cur.fetchone()
                    if not owner_row or owner_row[0] != int(user_id):
                        return {
                            'statusCode': 403,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'error': 'Forbidden'}),
                            'isBase64Encoded': False
                        }
                    
                    cur.execute(f"UPDATE time_entries SET hours = 0 WHERE id = {entry_id}")
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': True}),
                        'isBase64Encoded': False
                    }
                
                else:
                    return {
                        'statusCode': 405,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Method not allowed'}),
                        'isBase64Encoded': False
                    }
    
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid JSON'}),
            'isBase64Encoded': False
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Server error: {str(e)}'}),
            'isBase64Encoded': False
        }
