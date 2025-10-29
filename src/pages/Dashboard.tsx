import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const Dashboard = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<'employee' | 'admin' | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedActivity, setSelectedActivity] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    const role = localStorage.getItem('userRole') as 'employee' | 'admin' | null;
    if (!role) {
      navigate('/');
      return;
    }
    setUserRole(role);
  }, [navigate]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTracking) {
      interval = setInterval(() => {
        setCurrentTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking]);

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    navigate('/');
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const weekData = [
    { day: 'Пн', hours: 8.5 },
    { day: 'Вт', hours: 7.2 },
    { day: 'Ср', hours: 9.1 },
    { day: 'Чт', hours: 8.0 },
    { day: 'Пт', hours: 6.5 },
  ];

  const projectData = [
    { name: 'Проект А', value: 35, color: '#8B5CF6' },
    { name: 'Проект Б', value: 28, color: '#0EA5E9' },
    { name: 'Проект В', value: 20, color: '#10B981' },
    { name: 'Прочее', value: 17, color: '#F59E0B' },
  ];

  const activityData = [
    { month: 'Янв', hours: 160 },
    { month: 'Фев', hours: 155 },
    { month: 'Мар', hours: 175 },
    { month: 'Апр', hours: 168 },
    { month: 'Май', hours: 180 },
    { month: 'Июн', hours: 172 },
  ];

  const projects = ['Проект А', 'Проект Б', 'Проект В', 'Проект Г'];
  const activities = ['Разработка', 'Тестирование', 'Встречи', 'Документация', 'Код-ревью'];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 backdrop-blur-sm bg-card/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
              <Icon name="Clock" size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold">TimeTracker</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm text-muted-foreground">Вы вошли как</p>
              <p className="font-semibold">{userRole === 'admin' ? 'Администратор' : 'Сотрудник'}</p>
            </div>
            <Button variant="outline" onClick={handleLogout} className="hover:scale-105 transition-all">
              <Icon name="LogOut" size={16} className="mr-2" />
              Выйти
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="tracker" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="tracker" className="transition-all">
              <Icon name="Timer" size={16} className="mr-2" />
              Трекер
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="transition-all">
              <Icon name="LayoutDashboard" size={16} className="mr-2" />
              Дашборд
            </TabsTrigger>
            <TabsTrigger value="projects" className="transition-all">
              <Icon name="FolderKanban" size={16} className="mr-2" />
              Проекты
            </TabsTrigger>
            <TabsTrigger value="calendar" className="transition-all">
              <Icon name="Calendar" size={16} className="mr-2" />
              Календарь
            </TabsTrigger>
            {userRole === 'admin' && (
              <TabsTrigger value="team" className="transition-all">
                <Icon name="Users" size={16} className="mr-2" />
                Команда
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="tracker" className="space-y-6 animate-fade-in">
            <Card className="backdrop-blur-sm bg-card/95 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Timer" size={24} className="text-primary" />
                  Текущая сессия
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-8">
                  <div className="text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    {formatTime(currentTime)}
                  </div>
                  <p className="text-muted-foreground mt-2">
                    {isTracking ? 'Идет отслеживание времени' : 'Готово к старту'}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Проект</label>
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
                    <label className="text-sm font-medium">Тип занятости</label>
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

                <div className="flex gap-3 justify-center">
                  <Button
                    size="lg"
                    onClick={() => setIsTracking(!isTracking)}
                    className={`transition-all hover:scale-105 ${
                      isTracking 
                        ? 'bg-destructive hover:bg-destructive/90' 
                        : 'bg-gradient-to-r from-primary to-secondary hover:opacity-90'
                    }`}
                  >
                    <Icon name={isTracking ? 'Pause' : 'Play'} size={20} className="mr-2" />
                    {isTracking ? 'Остановить' : 'Начать'}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => setCurrentTime(0)}
                    className="transition-all hover:scale-105"
                  >
                    <Icon name="RotateCcw" size={20} className="mr-2" />
                    Сбросить
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-6 animate-fade-in">
            <div className="grid md:grid-cols-4 gap-4">
              <Card className="backdrop-blur-sm bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Сегодня</p>
                      <p className="text-3xl font-bold">7.5ч</p>
                    </div>
                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                      <Icon name="Clock" size={24} className="text-primary" />
                    </div>
                  </div>
                  <Progress value={93} className="mt-3" />
                </CardContent>
              </Card>

              <Card className="backdrop-blur-sm bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Эта неделя</p>
                      <p className="text-3xl font-bold">39.3ч</p>
                    </div>
                    <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center">
                      <Icon name="TrendingUp" size={24} className="text-secondary" />
                    </div>
                  </div>
                  <Progress value={98} className="mt-3" />
                </CardContent>
              </Card>

              <Card className="backdrop-blur-sm bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Этот месяц</p>
                      <p className="text-3xl font-bold">172ч</p>
                    </div>
                    <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                      <Icon name="Calendar" size={24} className="text-green-500" />
                    </div>
                  </div>
                  <Progress value={86} className="mt-3" />
                </CardContent>
              </Card>

              <Card className="backdrop-blur-sm bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Проекты</p>
                      <p className="text-3xl font-bold">4</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                      <Icon name="FolderKanban" size={24} className="text-orange-500" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3">Активных проекта</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="backdrop-blur-sm bg-card/95 border-border/50">
                <CardHeader>
                  <CardTitle>Активность за неделю</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={weekData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-sm bg-card/95 border-border/50">
                <CardHeader>
                  <CardTitle>Распределение по проектам</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={projectData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.value}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {projectData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-sm bg-card/95 border-border/50 lg:col-span-2">
                <CardHeader>
                  <CardTitle>Динамика за 6 месяцев</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={activityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="hours" 
                        stroke="hsl(var(--secondary))" 
                        strokeWidth={3}
                        dot={{ fill: 'hsl(var(--secondary))', r: 6 }}
                        name="Часы"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="projects" className="animate-fade-in">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project, index) => (
                <Card key={project} className="backdrop-blur-sm bg-card/95 border-border/50 hover:scale-105 transition-all cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{project}</h3>
                        <p className="text-sm text-muted-foreground">Активный проект</p>
                      </div>
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        index === 0 ? 'bg-primary/20' :
                        index === 1 ? 'bg-secondary/20' :
                        index === 2 ? 'bg-green-500/20' : 'bg-orange-500/20'
                      }`}>
                        <Icon name="FolderKanban" size={20} className={
                          index === 0 ? 'text-primary' :
                          index === 1 ? 'text-secondary' :
                          index === 2 ? 'text-green-500' : 'text-orange-500'
                        } />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Прогресс</span>
                        <span className="font-medium">{85 - index * 10}%</span>
                      </div>
                      <Progress value={85 - index * 10} />
                      <div className="flex justify-between text-sm pt-2">
                        <span className="text-muted-foreground">Часов: {120 - index * 20}</span>
                        <span className="text-muted-foreground">Задач: {15 - index * 3}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="calendar" className="animate-fade-in">
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="backdrop-blur-sm bg-card/95 border-border/50 lg:col-span-2">
                <CardHeader>
                  <CardTitle>Выберите дату</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border border-border"
                    locale={ru}
                  />
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card className="backdrop-blur-sm bg-card/95 border-border/50">
                  <CardHeader>
                    <CardTitle className="text-base">
                      {selectedDate ? format(selectedDate, 'dd MMMM yyyy', { locale: ru }) : 'Выберите дату'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Icon name="Clock" size={16} className="text-primary" />
                          <span className="text-sm">Всего часов</span>
                        </div>
                        <span className="font-semibold">8.5ч</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Icon name="FolderKanban" size={16} className="text-secondary" />
                          <span className="text-sm">Проектов</span>
                        </div>
                        <span className="font-semibold">3</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Icon name="CheckCircle2" size={16} className="text-green-500" />
                          <span className="text-sm">Задач</span>
                        </div>
                        <span className="font-semibold">12</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="backdrop-blur-sm bg-card/95 border-border/50">
                  <CardHeader>
                    <CardTitle className="text-base">Сессии</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {[
                      { time: '09:00 - 12:30', project: 'Проект А', hours: '3.5ч' },
                      { time: '13:30 - 17:00', project: 'Проект Б', hours: '3.5ч' },
                      { time: '17:30 - 19:00', project: 'Проект В', hours: '1.5ч' },
                    ].map((session, index) => (
                      <div key={index} className="p-3 bg-muted/50 rounded-lg space-y-1">
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-medium">{session.project}</span>
                          <span className="text-xs text-primary">{session.hours}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{session.time}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {userRole === 'admin' && (
            <TabsContent value="team" className="animate-fade-in">
              <Card className="backdrop-blur-sm bg-card/95 border-border/50">
                <CardHeader>
                  <CardTitle>Команда</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: 'Иван Петров', role: 'Frontend Developer', hours: 172, projects: 3, avatar: '👨‍💻' },
                      { name: 'Мария Сидорова', role: 'Backend Developer', hours: 168, projects: 4, avatar: '👩‍💻' },
                      { name: 'Алексей Смирнов', role: 'QA Engineer', hours: 160, projects: 5, avatar: '🧑‍💻' },
                      { name: 'Елена Кузнецова', role: 'UI/UX Designer', hours: 156, projects: 2, avatar: '👩‍🎨' },
                    ].map((member, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-2xl">
                            {member.avatar}
                          </div>
                          <div>
                            <h4 className="font-semibold">{member.name}</h4>
                            <p className="text-sm text-muted-foreground">{member.role}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-8 text-sm">
                          <div className="text-center">
                            <p className="font-semibold">{member.hours}ч</p>
                            <p className="text-muted-foreground">Этот месяц</p>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold">{member.projects}</p>
                            <p className="text-muted-foreground">Проектов</p>
                          </div>
                          <Button variant="outline" size="sm" className="hover:scale-105 transition-all">
                            <Icon name="Eye" size={16} className="mr-2" />
                            Детали
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
