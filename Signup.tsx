import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/db/supabase';
import { UserPlus, GraduationCap, Phone } from 'lucide-react';

export default function Signup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    rollNumber: '',
    phone: '',
    branch: '',
    year: '',
    username: '',
    password: '',
  });

  // Detect if name starts with "tech" (case-insensitive)
  useEffect(() => {
    const nameStartsWithTech = formData.name.toLowerCase().startsWith('tech');
    setIsTeacher(nameStartsWithTech);
    
    // Clear the opposite field when switching between teacher/student
    if (nameStartsWithTech) {
      setFormData(prev => ({ ...prev, rollNumber: '' }));
    } else {
      setFormData(prev => ({ ...prev, phone: '' }));
    }
  }, [formData.name]);

  // Get year options based on branch
  const getYearOptions = () => {
    if (formData.branch === 'B.C.A') {
      return [
        { value: 'First', label: 'First Year' },
        { value: 'Second', label: 'Second Year' },
      ];
    }
    return [
      { value: 'First', label: 'First Year' },
      { value: 'Second', label: 'Second Year' },
      { value: 'Third', label: 'Third Year' },
      { value: 'Fourth', label: 'Fourth Year' },
    ];
  };

  // Reset year if branch changes and current year is not valid
  useEffect(() => {
    const validYears = getYearOptions().map(opt => opt.value);
    if (formData.year && !validYears.includes(formData.year)) {
      setFormData(prev => ({ ...prev, year: '' }));
    }
  }, [formData.branch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate based on user type
    if (isTeacher) {
      // Teacher validation
      if (!formData.phone || formData.phone.length !== 10 || !/^\d{10}$/.test(formData.phone)) {
        toast({
          title: 'Invalid Phone Number',
          description: 'Phone number must be exactly 10 digits',
          variant: 'destructive',
        });
        return;
      }
    } else {
      // Student validation
      if (formData.rollNumber.length !== 12 || !/^\d{12}$/.test(formData.rollNumber)) {
        toast({
          title: 'Invalid Roll Number',
          description: 'Roll number must be exactly 12 digits',
          variant: 'destructive',
        });
        return;
      }
    }

    // Check if username is "Admin" (case-insensitive) - only first user can be admin
    if (formData.username.toLowerCase() === 'admin') {
      toast({
        title: 'Invalid Username',
        description: 'Username "Admin" is reserved. Please choose a different username.',
        variant: 'destructive',
      });
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      toast({
        title: 'Invalid Username',
        description: 'Username can only contain letters, numbers, and underscores',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: 'Weak Password',
        description: 'Password must be at least 6 characters long',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: `${formData.username}@miaoda.com`,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            roll_number: isTeacher ? null : formData.rollNumber,
            phone: isTeacher ? formData.phone : null,
            branch: formData.branch,
            year: formData.year,
            is_teacher: isTeacher,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        toast({
          title: 'Registration Successful! 🎉',
          description: `You can now log in with your credentials${isTeacher ? ' (Teacher Account)' : ''}`,
        });
        navigate('/login');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during signup';
      toast({
        title: 'Signup Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            {isTeacher ? (
              <GraduationCap className="h-6 w-6 text-primary" />
            ) : (
              <UserPlus className="h-6 w-6 text-primary" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {isTeacher ? 'Teacher Registration' : 'Student Registration'}
          </CardTitle>
          <CardDescription>
            {isTeacher 
              ? 'Create your teacher account to order from the canteen'
              : 'Create your account to order from the canteen'}
          </CardDescription>
          {isTeacher && (
            <p className="text-xs text-primary mt-2">
              ✓ Teacher account detected (name starts with "tech")
            </p>
          )}
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder={isTeacher ? "tech [Your Name]" : "Enter your full name"}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                {isTeacher 
                  ? '✓ Teacher account (starts with "tech")'
                  : 'Start with "tech" for teacher account (e.g., "tech John Doe")'}
              </p>
            </div>

            {isTeacher ? (
              <div className="space-y-2">
                <Label htmlFor="phone">
                  <Phone className="inline h-4 w-4 mr-1" />
                  Phone Number (10 digits)
                </Label>
                <Input
                  id="phone"
                  type="text"
                  placeholder="9876543210"
                  maxLength={10}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                  required
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="rollNumber">Roll Number (12 digits)</Label>
                <Input
                  id="rollNumber"
                  type="text"
                  placeholder="123456789012"
                  maxLength={12}
                  value={formData.rollNumber}
                  onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value.replace(/\D/g, '') })}
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="branch">Branch</Label>
              <Select value={formData.branch} onValueChange={(value) => setFormData({ ...formData, branch: value })} required>
                <SelectTrigger id="branch">
                  <SelectValue placeholder="Select your branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Computer Science">Computer Science</SelectItem>
                  <SelectItem value="Information Technology">Information Technology</SelectItem>
                  <SelectItem value="Electronics">Electronics</SelectItem>
                  <SelectItem value="Mechanical">Mechanical</SelectItem>
                  <SelectItem value="Civil">Civil</SelectItem>
                  <SelectItem value="Electrical">Electrical</SelectItem>
                  <SelectItem value="B.C.A">B.C.A</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Select value={formData.year} onValueChange={(value) => setFormData({ ...formData, year: value })} required>
                <SelectTrigger id="year">
                  <SelectValue placeholder="Select your year" />
                </SelectTrigger>
                <SelectContent>
                  {getYearOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.branch === 'B.C.A' && (
                <p className="text-xs text-muted-foreground">
                  B.C.A has 2 years only
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Choose a username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Only letters, numbers, and underscores allowed (not "Admin")
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline">
                Log in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
