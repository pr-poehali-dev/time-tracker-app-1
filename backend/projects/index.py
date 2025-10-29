'''
Business: Получение списка проектов и типов занятости
Args: event - dict с httpMethod='GET'
Returns: HTTP response со списком проектов и активностей
'''

import json
import os
import psycopg

def handler(event, context):
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
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
                cur.execute('SELECT id, name, description FROM projects ORDER BY name')
                projects_rows = cur.fetchall()
                
                cur.execute('SELECT id, name FROM activities ORDER BY name')
                activities_rows = cur.fetchall()
                
                projects = [{'id': row[0], 'name': row[1], 'description': row[2]} for row in projects_rows]
                activities = [{'id': row[0], 'name': row[1]} for row in activities_rows]
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'projects': projects, 'activities': activities}),
                    'isBase64Encoded': False
                }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Server error: {str(e)}'}),
            'isBase64Encoded': False
        }
