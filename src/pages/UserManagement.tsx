import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Search, UserPlus, Shield, Users, Edit, Plus } from 'lucide-react';

interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'user';
  created_at: string;
}

interface Profile {
  id: string;
  user_id: string;
  nome_completo: string | null;
  telefone: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  data_nascimento: string | null;
  created_at: string;
  updated_at: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<UserRole[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nome_completo: '',
    telefone: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    data_nascimento: '',
    role: 'user' as 'admin' | 'user'
  });
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchUsersAndRoles();
    }
  }, [user]);

  const fetchUsersAndRoles = async () => {
    try {
      setLoading(true);
      
      // Fetch all profiles first
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;
      setProfiles(profilesData || []);

      // Fetch user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (rolesError) throw rolesError;
      setUsers(rolesData || []);

    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os usuários.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      // Check if user already has a role
      const existingUser = users.find(u => u.user_id === userId);
      
      if (existingUser) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({ role: newRole })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: newRole });

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: `Permissão atualizada para ${newRole}.`,
      });

      fetchUsersAndRoles();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a permissão.",
        variant: "destructive",
      });
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || (!editingProfile && !formData.password)) {
      toast({
        title: "Erro",
        description: "Email e senha são obrigatórios para criar um usuário.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingProfile) {
        // Update existing profile
        const { error } = await supabase
          .from('profiles')
          .update({
            nome_completo: formData.nome_completo || null,
            telefone: formData.telefone || null,
            endereco: formData.endereco || null,
            cidade: formData.cidade || null,
            estado: formData.estado || null,
            cep: formData.cep || null,
            data_nascimento: formData.data_nascimento || null,
          })
          .eq('id', editingProfile.id);

        if (error) throw error;

        // Update password if provided
        if (formData.password.trim()) {
          const { error: passwordError } = await supabase.auth.admin.updateUserById(
            editingProfile.user_id,
            { password: formData.password }
          );
          if (passwordError) throw passwordError;
        }

        // Update role if changed
        await updateUserRole(editingProfile.user_id, formData.role);

        toast({
          title: "Sucesso",
          description: "Usuário atualizado com sucesso!",
        });
      } else {
        // Create new user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              nome_completo: formData.nome_completo
            }
          }
        });

        if (authError) throw authError;

        if (authData.user) {
          // Update profile with additional data
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              nome_completo: formData.nome_completo || null,
              telefone: formData.telefone || null,
              endereco: formData.endereco || null,
              cidade: formData.cidade || null,
              estado: formData.estado || null,
              cep: formData.cep || null,
              data_nascimento: formData.data_nascimento || null,
            })
            .eq('user_id', authData.user.id);

          if (profileError) throw profileError;

          // Set user role
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({ user_id: authData.user.id, role: formData.role });

          if (roleError) throw roleError;

          toast({
            title: "Sucesso",
            description: "Usuário criado com sucesso!",
          });
        }
      }

      setDialogOpen(false);
      setEditingProfile(null);
      setFormData({
        email: '',
        password: '',
        nome_completo: '',
        telefone: '',
        endereco: '',
        cidade: '',
        estado: '',
        cep: '',
        data_nascimento: '',
        role: 'user'
      });
      fetchUsersAndRoles();
    } catch (error: any) {
      console.error('Error saving user:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar o usuário.",
        variant: "destructive",
      });
    }
  };

  const handleEditUser = (profile: Profile) => {
    setEditingProfile(profile);
    setFormData({
      email: '',
      password: '',
      nome_completo: profile.nome_completo || '',
      telefone: profile.telefone || '',
      endereco: profile.endereco || '',
      cidade: profile.cidade || '',
      estado: profile.estado || '',
      cep: profile.cep || '',
      data_nascimento: profile.data_nascimento || '',
      role: getUserRole(profile.user_id)
    });
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingProfile(null);
    setFormData({
      email: '',
      password: '',
      nome_completo: '',
      telefone: '',
      endereco: '',
      cidade: '',
      estado: '',
      cep: '',
      data_nascimento: '',
      role: 'user'
    });
  };

  const filteredUsers = profiles.filter(profile =>
    profile.nome_completo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    profile.user_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getUserRole = (userId: string): 'admin' | 'user' => {
    const userRole = users.find(u => u.user_id === userId);
    return userRole?.role || 'user';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando usuários...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestão de Usuários</h1>
            <p className="text-muted-foreground">Gerencie permissões e roles dos usuários</p>
          </div>
        </div>
      </div>

      {/* Search, Add and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="md:col-span-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Buscar usuários..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <form onSubmit={handleCreateUser}>
                <DialogHeader>
                  <DialogTitle>
                    {editingProfile ? 'Editar Usuário' : 'Novo Usuário'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingProfile 
                      ? 'Atualize as informações do usuário.' 
                      : 'Crie um novo usuário no sistema.'
                    }
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  {!editingProfile && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          placeholder="usuario@exemplo.com"
                          required={!editingProfile}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="password">Senha *</Label>
                        <Input
                          id="password"
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                          placeholder="Senha do usuário"
                          required={!editingProfile}
                        />
                      </div>
                    </div>
                  )}
                  
                  {editingProfile && (
                    <div className="grid gap-2">
                      <Label htmlFor="password">Nova Senha (opcional)</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        placeholder="Deixe em branco para manter a senha atual"
                      />
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="nome_completo">Nome Completo</Label>
                      <Input
                        id="nome_completo"
                        value={formData.nome_completo}
                        onChange={(e) => setFormData({...formData, nome_completo: e.target.value})}
                        placeholder="Nome completo do usuário"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="telefone">Telefone</Label>
                      <Input
                        id="telefone"
                        value={formData.telefone}
                        onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="endereco">Endereço</Label>
                    <Input
                      id="endereco"
                      value={formData.endereco}
                      onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                      placeholder="Rua, número, complemento"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="cidade">Cidade</Label>
                      <Input
                        id="cidade"
                        value={formData.cidade}
                        onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                        placeholder="Cidade"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="estado">Estado</Label>
                      <Input
                        id="estado"
                        value={formData.estado}
                        onChange={(e) => setFormData({...formData, estado: e.target.value})}
                        placeholder="UF"
                        maxLength={2}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="cep">CEP</Label>
                      <Input
                        id="cep"
                        value={formData.cep}
                        onChange={(e) => setFormData({...formData, cep: e.target.value})}
                        placeholder="00000-000"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                      <Input
                        id="data_nascimento"
                        type="date"
                        value={formData.data_nascimento}
                        onChange={(e) => setFormData({...formData, data_nascimento: e.target.value})}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="role">Permissão</Label>
                      <Select value={formData.role} onValueChange={(value: 'admin' | 'user') => setFormData({...formData, role: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">Usuário</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingProfile ? 'Atualizar' : 'Criar'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Admins</p>
                <p className="text-xl font-bold">{users.filter(u => u.role === 'admin').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-xl font-bold">{profiles.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários do Sistema</CardTitle>
          <CardDescription>
            Gerencie os usuários e suas permissões no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>ID do Usuário</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Permissão</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((profile) => {
                const currentRole = getUserRole(profile.user_id);
                return (
                  <TableRow key={profile.id}>
                    <TableCell className="font-medium">
                      {profile.nome_completo || 'Nome não informado'}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {profile.user_id}
                    </TableCell>
                    <TableCell>
                      {new Date(profile.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={currentRole === 'admin' ? 'default' : 'secondary'}>
                        {currentRole === 'admin' ? 'Administrador' : 'Usuário'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(profile)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {profile.user_id !== user?.id && (
                          <Select
                            value={currentRole}
                            onValueChange={(newRole: 'admin' | 'user') => 
                              updateUserRole(profile.user_id, newRole)
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">Usuário</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        {profile.user_id === user?.id && (
                          <Badge variant="outline">Você</Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;