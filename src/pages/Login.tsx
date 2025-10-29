import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (role: 'employee' | 'admin') => {
    localStorage.setItem('userRole', role);
    localStorage.setItem('userEmail', email);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-xl mb-4">
            <Icon name="Clock" size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-semibold text-gray-900">
            TimeTracker
          </h1>
          <p className="text-gray-500 mt-2">Учёт рабочего времени</p>
        </div>

        <Card className="p-6 bg-white border shadow-sm">
          <Tabs defaultValue="employee" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="employee" className="transition-all">
                <Icon name="User" size={16} className="mr-2" />
                Сотрудник
              </TabsTrigger>
              <TabsTrigger value="admin" className="transition-all">
                <Icon name="Shield" size={16} className="mr-2" />
                Администратор
              </TabsTrigger>
            </TabsList>

            <TabsContent value="employee" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-employee">Email</Label>
                <Input
                  id="email-employee"
                  type="email"
                  placeholder="employee@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className=""
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-employee">Пароль</Label>
                <Input
                  id="password-employee"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className=""
                />
              </div>
              <Button 
                onClick={() => handleLogin('employee')} 
                className="w-full"
              >
                <Icon name="LogIn" size={16} className="mr-2" />
                Войти как сотрудник
              </Button>
            </TabsContent>

            <TabsContent value="admin" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-admin">Email</Label>
                <Input
                  id="email-admin"
                  type="email"
                  placeholder="admin@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className=""
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-admin">Пароль</Label>
                <Input
                  id="password-admin"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className=""
                />
              </div>
              <Button 
                onClick={() => handleLogin('admin')} 
                className="w-full"
              >
                <Icon name="Shield" size={16} className="mr-2" />
                Войти как администратор
              </Button>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Забыли пароль? <span className="text-primary cursor-pointer hover:underline">Восстановить</span></p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;