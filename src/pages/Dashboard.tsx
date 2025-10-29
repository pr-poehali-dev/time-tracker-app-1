import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { ru } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { api, User, TimeEntry, Project, Activity } from '@/lib/api';
import { toast } from 'sonner';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'entries' | 'team'>('dashboard');
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedActivity, setSelectedActivity] = useState('');
  const [hours, setHours] = useState('');
  const [comment, setComment] = useState('');

  useEffect(() => {
    const userJson = localStorage.getItem('user');
    if (!userJson) {
      navigate('/');
      return;
    }
    
    const userData = JSON.parse(userJson);
    setUser(userData);
    loadData(userData.id);
  }, [navigate]);

  const loadData = async (userId: number) => {
    setIsLoading(true);
    try {
      const [entriesData, projectsData] = await Promise.all([
        api.getTimeEntries(userId),
        api.getProjectsAndActivities(),
      ]);
      
      setTimeEntries(entriesData);
      setProjects(projectsData.projects);
      setActivities(projectsData.activities);
    } catch (error) {
      toast.error('Ошибка загрузки данных');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleAddEntry = async () => {
    if (!selectedDate || !selectedProject || !selectedActivity || !hours || !user) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const numHours = parseFloat(hours);

    if (numHours <= 0 || numHours > 24) {
      toast.error('Часы должны быть от 0 до 24');
      return;
    }

    setIsLoading(true);
    try {
      if (isEditMode && editingEntry) {
        await api.updateTimeEntry(
          user.id,
          editingEntry.id,
          parseInt(selectedProject),
          parseInt(selectedActivity),
          dateStr,
          numHours,
          comment
        );
        toast.success('Запись обновлена');
      } else {
        await api.createTimeEntry(
          user.id,
          parseInt(selectedProject),
          parseInt(selectedActivity),
          dateStr,
          numHours,
          comment
        );
        toast.success('Запись добавлена');
      }
      
      await loadData(user.id);
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка сохранения');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedProject('');
    setSelectedActivity('');
    setHours('');
    setComment('');
    setIsDialogOpen(false);
    setIsEditMode(false);
    setEditingEntry(null);
  };

  const handleEditEntry = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setSelectedDate(new Date(entry.entry_date));
    setSelectedProject(entry.project_id.toString());
    setSelectedActivity(entry.activity_id.toString());
    setHours(entry.hours.toString());
    setComment(entry.comment || '');
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  const handleDeleteEntry = async (entryId: number) => {
    if (!confirm('Удалить эту запись?') || !user) return;
    
    setIsLoading(true);
    try {
      await api.deleteTimeEntry(user.id, entryId);
      toast.success('Запись удалена');
      await loadData(user.id);
    } catch (error) {
      toast.error('Ошибка удаления');
    } finally {
      setIsLoading(false);
    }
  };

  const exportToExcel = () => {
    const exportData = timeEntries.map(entry => ({
      'Дата': format(new Date(entry.entry_date), 'dd.MM.yyyy'),
      'Сотрудник': entry.user_name,
      'Email': entry.user_email,
      'Проект': entry.project_name,
      'Тип занятости': entry.activity_name,
      'Часы': entry.hours,
      'Комментарий': entry.comment || '',
      'Создано': format(new Date(entry.created_at), 'dd.MM.yyyy HH:mm'),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Учёт времени');
    XLSX.writeFile(wb, `timetracker_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    toast.success('Excel файл сохранён');
  };

  if (!user) return null;

  const myEntries = timeEntries.filter(e => e.user_id === user.id);
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayHours = myEntries.filter(e => e.entry_date === today).reduce((sum, e) => sum + e.hours, 0);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return format(date, 'yyyy-MM-dd');
  });

  const weekData = last7Days.map(date => ({
    day: format(new Date(date), 'EEE', { locale: ru }),
    hours: myEntries.filter(e => e.entry_date === date).reduce((sum, e) => sum + e.hours, 0)
  }));

  const projectStats = projects.map(project => {
    const projectHours = myEntries.filter(e => e.project_id === project.id).reduce((sum, e) => sum + e.hours, 0);
    return { project: project.name, hours: projectHours };
  }).filter(stat => stat.hours > 0);

  const allUsers = Array.from(new Set(timeEntries.map(e => ({
    id: e.user_id,
    name: e.user_name,
    email: e.user_email
  })).map(u => JSON.stringify(u)))).map(s => JSON.parse(s));

  const employeeStats = allUsers.map(emp => {
    const empEntries = timeEntries.filter(e => e.user_id === emp.id);
    const totalHours = empEntries.reduce((sum, e) => sum + e.hours, 0);
    const projectsWorked = [...new Set(empEntries.map(e => e.project_id))];
    const sortedEntries = [...empEntries].sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime());
    return {
      ...emp,
      totalHours,
      projectsCount: projectsWorked.length,
      lastEntry: sortedEntries[0]?.entry_date || '-',
    };
  });

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Icon name="Clock" size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">TimeTracker</h1>
            </div>
          </div>
          <div className="text-sm">
            <p className="font-medium text-gray-900">{user.full_name}</p>
            <p className="text-gray-500 text-xs">{user.email}</p>
            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="mt-2">
              {user.role === 'admin' ? 'Администратор' : 'Сотрудник'}
            </Badge>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
              currentView === 'dashboard'
                ? 'bg-primary text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Icon name="LayoutDashboard" size={20} />
            <span className="font-medium">Главная</span>
          </button>

          <button
            onClick={() => setCurrentView('entries')}
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
              currentView === 'entries'
                ? 'bg-primary text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Icon name="ListChecks" size={20} />
            <span className="font-medium">Записи времени</span>
          </button>

          {user.role === 'admin' && (
            <button
              onClick={() => setCurrentView('team')}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                currentView === 'team'
                  ? 'bg-primary text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon name="Users" size={20} />
              <span className="font-medium">Команда</span>
            </button>
          )}
        </nav>

        <div className="p-4 border-t">
          <Button variant="outline" onClick={handleLogout} className="w-full">
            <Icon name="LogOut" size={16} className="mr-2" />
            Выйти
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-6 py-6">
          {currentView === 'dashboard' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Главная</h2>
                <p className="text-sm text-gray-500 mt-1">Обзор вашей активности</p>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Сегодня</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{todayHours}ч</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Icon name="Clock" size={24} className="text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Эта неделя</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">
                          {weekData.reduce((sum, day) => sum + day.hours, 0)}ч
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <Icon name="TrendingUp" size={24} className="text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Проектов</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{projectStats.length}</p>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Icon name="FolderKanban" size={24} className="text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Активность за неделю</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={weekData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="day" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Распределение по проектам</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {projectStats.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">Нет данных</p>
                      ) : (
                        projectStats.map((stat, index) => (
                          <div key={stat.project}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium text-gray-700">{stat.project}</span>
                              <span className="text-gray-900 font-semibold">{stat.hours}ч</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary transition-all" 
                                style={{ 
                                  width: `${(stat.hours / Math.max(...projectStats.map(s => s.hours))) * 100}%`,
                                  opacity: 1 - (index * 0.15)
                                }}
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Последние записи</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {myEntries.slice(0, 5).map(entry => (
                      <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{entry.project_name}</p>
                          <p className="text-sm text-gray-600">
                            {format(new Date(entry.entry_date), 'dd MMM yyyy', { locale: ru })} • {entry.activity_name}
                          </p>
                          {entry.comment && (
                            <p className="text-xs text-gray-500 mt-1">{entry.comment}</p>
                          )}
                        </div>
                        <span className="text-primary font-semibold">{entry.hours}ч</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {currentView === 'entries' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Мои записи</h2>
                  <p className="text-sm text-gray-500 mt-1">Учёт рабочего времени</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                  setIsDialogOpen(open);
                  if (!open) resetForm();
                }}>
                  <DialogTrigger asChild>
                    <Button>
                      <Icon name="Plus" size={16} className="mr-2" />
                      Добавить запись
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white max-w-lg">
                    <DialogHeader>
                      <DialogTitle>{isEditMode ? 'Редактировать запись' : 'Новая запись'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>Дата</Label>
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          className="rounded-md border"
                          locale={ru}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Проект *</Label>
                          <Select value={selectedProject} onValueChange={setSelectedProject}>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите" />
                            </SelectTrigger>
                            <SelectContent>
                              {projects.map(project => (
                                <SelectItem key={project.id} value={project.id.toString()}>
                                  {project.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Занятость *</Label>
                          <Select value={selectedActivity} onValueChange={setSelectedActivity}>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите" />
                            </SelectTrigger>
                            <SelectContent>
                              {activities.map(activity => (
                                <SelectItem key={activity.id} value={activity.id.toString()}>
                                  {activity.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Часы *</Label>
                        <Input
                          type="number"
                          step="0.5"
                          min="0"
                          max="24"
                          placeholder="0.0"
                          value={hours}
                          onChange={(e) => setHours(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Комментарий</Label>
                        <Textarea
                          placeholder="Что было сделано..."
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleAddEntry} className="flex-1" disabled={isLoading}>
                          {isEditMode ? 'Сохранить' : 'Добавить'}
                        </Button>
                        {isEditMode && (
                          <Button variant="outline" onClick={resetForm}>
                            Отмена
                          </Button>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Дата</TableHead>
                        <TableHead>Проект</TableHead>
                        <TableHead>Занятость</TableHead>
                        <TableHead>Комментарий</TableHead>
                        <TableHead className="text-right">Часы</TableHead>
                        <TableHead className="text-right">Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {myEntries.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                            Нет записей
                          </TableCell>
                        </TableRow>
                      ) : (
                        myEntries.map(entry => (
                          <TableRow key={entry.id}>
                            <TableCell>
                              {format(new Date(entry.entry_date), 'dd MMM yyyy', { locale: ru })}
                            </TableCell>
                            <TableCell>{entry.project_name}</TableCell>
                            <TableCell>{entry.activity_name}</TableCell>
                            <TableCell className="max-w-xs truncate text-sm text-gray-600">
                              {entry.comment || '—'}
                            </TableCell>
                            <TableCell className="text-right font-semibold">{entry.hours}ч</TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-1 justify-end">
                                <Button variant="ghost" size="sm" onClick={() => handleEditEntry(entry)}>
                                  <Icon name="Pencil" size={16} />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteEntry(entry.id)}>
                                  <Icon name="Trash2" size={16} className="text-red-600" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {currentView === 'team' && user.role === 'admin' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Команда</h2>
                  <p className="text-sm text-gray-500 mt-1">Статистика сотрудников</p>
                </div>
                <Button onClick={exportToExcel}>
                  <Icon name="Download" size={16} className="mr-2" />
                  Экспорт в Excel
                </Button>
              </div>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Сотрудник</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-right">Всего часов</TableHead>
                        <TableHead className="text-right">Проектов</TableHead>
                        <TableHead>Последняя запись</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employeeStats.map(emp => (
                        <TableRow key={emp.id}>
                          <TableCell className="font-medium">{emp.name}</TableCell>
                          <TableCell className="text-gray-600">{emp.email}</TableCell>
                          <TableCell className="text-right font-semibold">{emp.totalHours}ч</TableCell>
                          <TableCell className="text-right">{emp.projectsCount}</TableCell>
                          <TableCell>
                            {emp.lastEntry !== '-' ? format(new Date(emp.lastEntry), 'dd MMM yyyy', { locale: ru }) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <div className="grid lg:grid-cols-3 gap-4">
                {projects.map((project) => {
                  const projectEntries = timeEntries.filter(e => e.project_id === project.id);
                  const projectHours = projectEntries.reduce((sum, e) => sum + e.hours, 0);
                  const projectEmployees = [...new Set(projectEntries.map(e => e.user_id))];
                  
                  return (
                    <Card key={project.id}>
                      <CardHeader>
                        <CardTitle className="text-base">{project.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Часов</span>
                            <span className="font-semibold">{projectHours}ч</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Сотрудников</span>
                            <span className="font-semibold">{projectEmployees.length}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Записей</span>
                            <span className="font-semibold">{projectEntries.length}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
