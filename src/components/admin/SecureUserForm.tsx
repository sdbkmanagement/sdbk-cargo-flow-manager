
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, User, Mail, Phone, AlertTriangle } from 'lucide-react';
import { useSecureForm } from '@/hooks/useSecureForm';
import { validateEmail, validateName, validatePhone } from '@/utils/securityValidation';
import { generateSecurePassword } from '@/utils/securePasswordGenerator';
import { userService } from '@/services/admin/userService';
import { ROLES, ROLE_LABELS, MODULE_PERMISSIONS } from '@/types/admin';
import { toast } from '@/hooks/use-toast';

interface SecureUserFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const SecureUserForm: React.FC<SecureUserFormProps> = ({ onSuccess, onCancel }) => {
  const [selectedRole, setSelectedRole] = React.useState<string>('');
  const [selectedModules, setSelectedModules] = React.useState<string[]>([]);
  const [generatedPassword, setGeneratedPassword] = React.useState<string>('');

  const {
    fields,
    isSubmitting,
    submitError,
    hasErrors,
    handleSubmit,
    getFieldProps
  } = useSecureForm({
    initialValues: {
      email: '',
      firstName: '',
      lastName: '',
      phone: ''
    },
    validators: {
      email: validateEmail,
      firstName: (value) => validateName(value, 'First name'),
      lastName: (value) => validateName(value, 'Last name'),
      phone: validatePhone
    },
    onSubmit: async (values) => {
      if (!selectedRole) {
        throw new Error('Please select a role');
      }

      const password = generateSecurePassword();
      setGeneratedPassword(password);

      try {
        await userService.createUser({
          email: values.email,
          nom: values.lastName,
          prenom: values.firstName,
          firstName: values.firstName,
          lastName: values.lastName,
          role: selectedRole,
          roles: [selectedRole],
          module_permissions: selectedModules,
          password,
          statut: 'actif'
        });

        toast({
          title: "User created successfully",
          description: `Password: ${password} (save this securely)`
        });

        onSuccess?.();
      } catch (error: any) {
        throw new Error(error.message || 'Failed to create user');
      }
    }
  });

  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
    
    // Auto-assign modules based on role
    if (role === 'admin') {
      setSelectedModules([...MODULE_PERMISSIONS]);
    } else if (role === 'transport') {
      setSelectedModules(['fleet', 'missions', 'drivers']);
    } else if (role === 'rh') {
      setSelectedModules(['rh', 'drivers']);
    } else if (role === 'maintenance') {
      setSelectedModules(['fleet']);
    } else {
      setSelectedModules(['dashboard']);
    }
  };

  const handleModuleToggle = (module: string) => {
    setSelectedModules(prev => 
      prev.includes(module) 
        ? prev.filter(m => m !== module)
        : [...prev, module]
    );
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <CardTitle>Create Secure User Account</CardTitle>
        </div>
        <CardDescription>
          Create a new user account with secure credentials and proper permissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-3">
              <User className="h-4 w-4 text-gray-600" />
              <h3 className="text-lg font-medium">Personal Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  {...getFieldProps('firstName')}
                  className={fields.firstName?.error ? 'border-red-500' : ''}
                />
                {fields.firstName?.error && (
                  <p className="text-sm text-red-600">{fields.firstName.error}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  {...getFieldProps('lastName')}
                  className={fields.lastName?.error ? 'border-red-500' : ''}
                />
                {fields.lastName?.error && (
                  <p className="text-sm text-red-600">{fields.lastName.error}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="john.doe@company.com"
                  {...getFieldProps('email')}
                  className={`pl-10 ${fields.email?.error ? 'border-red-500' : ''}`}
                />
              </div>
              {fields.email?.error && (
                <p className="text-sm text-red-600">{fields.email.error}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1234567890"
                  {...getFieldProps('phone')}
                  className={`pl-10 ${fields.phone?.error ? 'border-red-500' : ''}`}
                />
              </div>
              {fields.phone?.error && (
                <p className="text-sm text-red-600">{fields.phone.error}</p>
              )}
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Role and Permissions</h3>
            
            <div className="space-y-2">
              <Label>Role *</Label>
              <Select value={selectedRole} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map(role => (
                    <SelectItem key={role} value={role}>
                      {ROLE_LABELS[role] || role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Module Permissions</Label>
              <div className="grid grid-cols-2 gap-2">
                {MODULE_PERMISSIONS.map(module => (
                  <label key={module} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedModules.includes(module)}
                      onChange={() => handleModuleToggle(module)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm capitalize">{module}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {submitError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          {generatedPassword && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Temporary Password:</strong> {generatedPassword}
                <br />
                <em>Please save this password securely and share it with the user.</em>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end space-x-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting || hasErrors || !selectedRole}
            >
              {isSubmitting ? 'Creating User...' : 'Create User'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
