import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { ru } from 'date-fns/locale';
import * as XLSX from 'xlsx';

interface TimeEntry {
  id: string;
  date: string;
  project: string;
  activity: string;
  hours: number;
  employee: string;
  comment?: string;
  createdAt: string;
  updatedAt?: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<'employee' | 'admin' | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedActivity, setSelectedActivity] = useState('');
  const [hours, setHours] = useState('');
  const [comment, setComment] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('all');
  const [detailsEmployee, setDetailsEmployee] = useState<string | null>(null);

  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([
    { id: '1', date: '2025-10-28', project: 'Проект А', activity: 'Разработка', hours: 6, employee: 'employee@company.com', comment: 'Работа над API', createdAt: '2025-10-28T09:00:00' },
    { id: '2', date: '2025-10-28', project: 'Проект Б', activity: 'Тестирование', hours: 2, employee: 'employee@company.com', comment: 'Тестирование новых функций', createdAt: '2025-10-28T14:00:00' },
    { id: '3', date: '2025-10-27', project: 'Проект А', activity: 'Код-ревью', hours: 4, employee: 'employee@company.com', createdAt: '2025-10-27T10:00:00' },
    { id: '4', date: '2025-10-27', project: 'Проект В', activity: 'Встречи', hours: 3.5, employee: 'employee@company.com', comment: 'Встреча с клиентом', createdAt: '2025-10-27T15:00:00' },
    { id: '5', date: '2025-10-28', project: 'Проект Б', activity: 'Разработка', hours: 7, employee: 'maria@company.com', comment: 'Backend разработка', createdAt: '2025-10-28T09:00:00' },
    { id: '6', date: '2025-10-27', project: 'Проект А', activity: 'Тестирование', hours: 8, employee: 'maria@company.com', createdAt: '2025-10-27T09:00:00' },
    { id: '7', date: '2025-10-28', project: 'Проект В', activity: 'Документация', hours: 5, employee: 'alex@company.com', comment: 'Обновление документации', createdAt: '2025-10-28T10:00:00' },
    { id: '8', date: '2025-10-26', project: 'Проект А', activity: 'Разработка', hours: 7, employee: 'employee@company.com', createdAt: '2025-10-26T09:00:00' },
    { id: '9', date: '2025-10-25', project: 'Проект Б', activity: 'Разработка', hours: 8, employee: 'maria@company.com', createdAt: '2025-10-25T09:00:00' },
    { id: '10', date: '2025-10-25', project: 'Проект В', activity: 'Тестирование', hours: 6, employee: 'alex@company.com', createdAt: '2025-10-25T10:00:00' },
  ]);

  useEffect(() => {
    const role = localStorage.getItem('userRole') as 'employee' | 'admin' | null;
    const email = localStorage.getItem('userEmail') || '';
    if (!role) {
      navigate('/');
      return;
    }
    setUserRole(role);
    setUserEmail(email);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    navigate('/');
  };

  const handleAddEntry = () => {
    if (!selectedDate || !selectedProject || !selectedActivity || !hours) {
      return;
    }

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const dailyTotal = timeEntries
      .filter(entry => entry.date === dateStr && entry.employee === userEmail && entry.id !== editingEntry?.id)
      .reduce((sum, entry) => sum + entry.hours, 0);

    const newHours = parseFloat(hours);
    if (dailyTotal + newHours > 8) {
      alert(`Превышена норма! У вас уже ${dailyTotal}ч за этот день. Максимум 8ч/день.`);
      return;
    }

    if (isEditMode && editingEntry) {
      const updatedEntry: TimeEntry = {
        ...editingEntry,
        date: dateStr,
        project: selectedProject,
        activity: selectedActivity,
        hours: newHours,
        comment,
        updatedAt: new Date().toISOString(),
      };
      setTimeEntries(timeEntries.map(e => e.id === editingEntry.id ? updatedEntry : e));
    } else {
      const newEntry: TimeEntry = {
        id: Date.now().toString(),
        date: dateStr,
        project: selectedProject,
        activity: selectedActivity,
        hours: newHours,
        employee: userEmail,
        comment,
        createdAt: new Date().toISOString(),
      };
      setTimeEntries([newEntry, ...timeEntries]);
    }

    resetForm();
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
    setSelectedDate(new Date(entry.date));
    setSelectedProject(entry.project);
    setSelectedActivity(entry.activity);
    setHours(entry.hours.toString());
    setComment(entry.comment || '');
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  const handleDeleteEntry = (id: string) => {
    if (confirm('Вы уверены, что хотите удалить эту запись?')) {
      setTimeEntries(timeEntries.filter(entry => entry.id !== id));
    }
  };

  const exportToExcel = () => {
    const exportData = timeEntries.map(entry => {
      const emp = employees.find(e => e.email === entry.employee);
      return {
        'Дата': format(new Date(entry.date), 'dd.MM.yyyy'),
        'Сотрудник': emp?.name || entry.employee,
        'Email': entry.employee,
        'Проект': entry.project,
        'Тип занятости': entry.activity,
        'Часы': entry.hours,
        'Комментарий': entry.comment || '',
        'Создано': format(new Date(entry.createdAt), 'dd.MM.yyyy HH:mm'),
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Учёт времени');
    
    const colWidths = [
      { wch: 12 },
      { wch: 20 },
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 8 },
      { wch: 30 },
      { wch: 18 },
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, `timetracker_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const projects = ['Проект А', 'Проект Б', 'Проект В', 'Проект Г'];
  const activities = ['Разработка', 'Тестирование', 'Встречи', 'Документация', 'Код-ревью'];

  const employees = [
    { email: 'employee@company.com', name: 'Иван Петров' },
    { email: 'maria@company.com', name: 'Мария Сидорова' },
    { email: 'alex@company.com', name: 'Алексей Смирнов' },
  ];

  const getFilteredEntries = (entries: TimeEntry[]) => {
    let filtered = entries;

    if (filterProject !== 'all') {
      filtered = filtered.filter(e => e.project === filterProject);
    }

    if (filterPeriod !== 'all') {
      const now = new Date();
      if (filterPeriod === 'today') {
        filtered = filtered.filter(e => e.date === format(now, 'yyyy-MM-dd'));
      } else if (filterPeriod === 'week') {
        const weekStart = format(startOfWeek(now, { locale: ru }), 'yyyy-MM-dd');
        const weekEnd = format(endOfWeek(now, { locale: ru }), 'yyyy-MM-dd');
        filtered = filtered.filter(e => e.date >= weekStart && e.date <= weekEnd);
      } else if (filterPeriod === 'month') {
        const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
        const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');
        filtered = filtered.filter(e => e.date >= monthStart && e.date <= monthEnd);
      }
    }

    return filtered;
  };

  const myEntries = getFilteredEntries(timeEntries.filter(entry => entry.employee === userEmail));
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayHours = timeEntries.filter(e => e.date === today && e.employee === userEmail).reduce((sum, e) => sum + e.hours, 0);
  
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return format(date, 'yyyy-MM-dd');
  });

  const weekData = last7Days.map(date => ({
    day: format(new Date(date), 'EEE', { locale: ru }),
    hours: timeEntries.filter(e => e.date === date && e.employee === userEmail).reduce((sum, e) => sum + e.hours, 0)
  }));

  const projectStats = projects.map(project => {
    const projectHours = myEntries.filter(e => e.project === project).reduce((sum, e) => sum + e.hours, 0);
    return { project, hours: projectHours };
  }).filter(stat => stat.hours > 0);

  const employeeStats = employees.map(emp => {
    const empEntries = timeEntries.filter(e => e.employee === emp.email);
    const totalHours = empEntries.reduce((sum, e) => sum + e.hours, 0);
    const projectsWorked = [...new Set(empEntries.map(e => e.project))];
    const sortedEntries = [...empEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return {
      ...emp,
      totalHours,
      projectsCount: projectsWorked.length,
      lastEntry: sortedEntries[0]?.date || '-',
      entries: empEntries,
    };
  });

  const getEmployeeDetails = (email: string) => {
    const emp = employees.find(e => e.email === email);
    const empEntries = timeEntries.filter(e => e.employee === email);
    const totalHours = empEntries.reduce((sum, e) => sum + e.hours, 0);
    
    const projectBreakdown = projects.map(project => {
      const hours = empEntries.filter(e => e.project === project).reduce((sum, e) => sum + e.hours, 0);
      return { project, hours };
    }).filter(p => p.hours > 0);

    const activityBreakdown = activities.map(activity => {
      const hours = empEntries.filter(e => e.activity === activity).reduce((sum, e) => sum + e.hours, 0);
      return { activity, hours };
    }).filter(a => a.hours > 0);

    const last14Days = Array.from({ length: 14 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (13 - i));
      return format(date, 'yyyy-MM-dd');
    });

    const trendData = last14Days.map(date => ({
      date: format(new Date(date), 'dd MMM', { locale: ru }),
      hours: empEntries.filter(e => e.date === date).reduce((sum, e) => sum + e.hours, 0)
    }));

    return {
      ...emp,
      totalHours,
      projectBreakdown,
      activityBreakdown,
      trendData,
      entries: empEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    };
  };

  if (detailsEmployee) {
    const details = getEmployeeDetails(detailsEmployee);
    
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="border-b bg-white sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setDetailsEmployee(null)}>
                <Icon name="ArrowLeft" size={20} />
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">Детали сотрудника</h1>
            </div>
            <Button variant="outline" onClick={handleLogout} size="sm">
              <Icon name="LogOut" size={16} className="mr-2" />
              Выйти
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{details.name}</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">{details.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Всего часов</p>
                  <p className="text-3xl font-bold text-gray-900">{details.totalHours}ч</p>
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Динамика за 2 недели</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={details.trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                    <Line type="monotone" dataKey="hours" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Распределение по проектам</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {details.projectBreakdown.map((stat, index) => (
                    <div key={stat.project}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">{stat.project}</span>
                        <span className="text-gray-900 font-semibold">{stat.hours}ч</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all" 
                          style={{ 
                            width: `${(stat.hours / details.totalHours) * 100}%`,
                            opacity: 1 - (index * 0.15)
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Типы занятости</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {details.activityBreakdown.map((stat, index) => (
                    <div key={stat.activity} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">{stat.activity}</span>
                      <Badge variant="secondary">{stat.hours}ч</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Последние записи</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {details.entries.slice(0, 10).map(entry => (
                    <div key={entry.id} className="p-3 bg-gray-50 rounded-lg text-sm">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-gray-900">{entry.project}</span>
                        <span className="text-primary font-semibold">{entry.hours}ч</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(entry.date), 'dd MMM yyyy', { locale: ru })} • {entry.activity}
                      </div>
                      {entry.comment && (
                        <div className="text-xs text-gray-600 mt-1">{entry.comment}</div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Icon name="Clock" size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">TimeTracker</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-gray-500">Вы вошли как</p>
              <p className="text-sm font-medium text-gray-900">{userRole === 'admin' ? 'Администратор' : 'Сотрудник'}</p>
            </div>
            <Button variant="outline" onClick={handleLogout} size="sm">
              <Icon name="LogOut" size={16} className="mr-2" />
              Выйти
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="entries" className="space-y-6">
          <TabsList className="bg-white border">
            <TabsTrigger value="entries">
              <Icon name="ListChecks" size={16} className="mr-2" />
              Записи времени
            </TabsTrigger>
            <TabsTrigger value="stats">
              <Icon name="BarChart3" size={16} className="mr-2" />
              Статистика
            </TabsTrigger>
            {userRole === 'admin' && (
              <TabsTrigger value="team">
                <Icon name="Users" size={16} className="mr-2" />
                Сотрудники
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="entries" className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Мои записи</h2>
                <p className="text-sm text-gray-500 mt-1">Учёт рабочего времени (норма 8ч/день)</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Select value={filterProject} onValueChange={setFilterProject}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все проекты</SelectItem>
                    {projects.map(project => (
                      <SelectItem key={project} value={project}>{project}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Весь период</SelectItem>
                    <SelectItem value="today">Сегодня</SelectItem>
                    <SelectItem value="week">Эта неделя</SelectItem>
                    <SelectItem value="month">Этот месяц</SelectItem>
                  </SelectContent>
                </Select>
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
                      <DialogTitle>{isEditMode ? 'Редактировать запись' : 'Новая запись времени'}</DialogTitle>
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
                          <Label>Проект</Label>
                          <Select value={selectedProject} onValueChange={setSelectedProject}>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите проект" />
                            </SelectTrigger>
                            <SelectContent>
                              {projects.map(project => (
                                <SelectItem key={project} value={project}>{project}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Тип занятости</Label>
                          <Select value={selectedActivity} onValueChange={setSelectedActivity}>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите активность" />
                            </SelectTrigger>
                            <SelectContent>
                              {activities.map(activity => (
                                <SelectItem key={activity} value={activity}>{activity}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Количество часов</Label>
                        <Input
                          type="number"
                          step="0.5"
                          min="0"
                          max="8"
                          placeholder="0.0"
                          value={hours}
                          onChange={(e) => setHours(e.target.value)}
                        />
                        <p className="text-xs text-gray-500">Максимум 8 часов в день</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Комментарий (опционально)</Label>
                        <Textarea
                          placeholder="Опишите выполненную работу..."
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleAddEntry} className="flex-1">
                          {isEditMode ? 'Сохранить' : 'Добавить запись'}
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
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Дата</TableHead>
                      <TableHead>Проект</TableHead>
                      <TableHead>Тип занятости</TableHead>
                      <TableHead>Комментарий</TableHead>
                      <TableHead className="text-right">Часы</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myEntries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                          Нет записей. Добавьте первую запись времени.
                        </TableCell>
                      </TableRow>
                    ) : (
                      myEntries.map(entry => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">
                            {format(new Date(entry.date), 'dd MMM yyyy', { locale: ru })}
                            {entry.updatedAt && (
                              <Badge variant="outline" className="ml-2 text-xs">изменено</Badge>
                            )}
                          </TableCell>
                          <TableCell>{entry.project}</TableCell>
                          <TableCell>{entry.activity}</TableCell>
                          <TableCell className="max-w-xs truncate text-sm text-gray-600">
                            {entry.comment || '—'}
                          </TableCell>
                          <TableCell className="text-right font-semibold">{entry.hours}ч</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditEntry(entry)}
                              >
                                <Icon name="Pencil" size={16} className="text-primary" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteEntry(entry.id)}
                              >
                                <Icon name="Trash2" size={16} className="text-destructive" />
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
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Сегодня</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{todayHours}ч</p>
                    <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all" 
                        style={{ width: `${Math.min((todayHours / 8) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">из 8 часов</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Эта неделя</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {weekData.reduce((sum, day) => sum + day.hours, 0)}ч
                    </p>
                    <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all" 
                        style={{ width: `${Math.min((weekData.reduce((sum, day) => sum + day.hours, 0) / 40) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">из 40 часов</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Всего проектов</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{projectStats.length}</p>
                    <p className="text-xs text-gray-500 mt-4">Активных проекта</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Часы по дням недели</CardTitle>
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
                  <CardTitle className="text-lg font-semibold">Распределение по проектам</CardTitle>
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
          </TabsContent>

          {userRole === 'admin' && (
            <TabsContent value="team" className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Сотрудники</h2>
                  <p className="text-sm text-gray-500 mt-1">Статистика по команде</p>
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
                        <TableHead className="text-right">Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employeeStats.map(emp => (
                        <TableRow key={emp.email}>
                          <TableCell className="font-medium">{emp.name}</TableCell>
                          <TableCell className="text-gray-600">{emp.email}</TableCell>
                          <TableCell className="text-right font-semibold">{emp.totalHours}ч</TableCell>
                          <TableCell className="text-right">{emp.projectsCount}</TableCell>
                          <TableCell>
                            {emp.lastEntry !== '-' ? format(new Date(emp.lastEntry), 'dd MMM yyyy', { locale: ru }) : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setDetailsEmployee(emp.email)}
                            >
                              <Icon name="Eye" size={16} className="mr-2" />
                              Детали
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <div className="grid lg:grid-cols-3 gap-4">
                {projects.map((project) => {
                  const projectEntries = timeEntries.filter(e => e.project === project);
                  const projectHours = projectEntries.reduce((sum, e) => sum + e.hours, 0);
                  const projectEmployees = [...new Set(projectEntries.map(e => e.employee))];
                  
                  return (
                    <Card key={project}>
                      <CardHeader>
                        <CardTitle className="text-base font-semibold">{project}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Всего часов</span>
                            <span className="font-semibold text-gray-900">{projectHours}ч</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Сотрудников</span>
                            <span className="font-semibold text-gray-900">{projectEmployees.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Записей</span>
                            <span className="font-semibold text-gray-900">{projectEntries.length}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
