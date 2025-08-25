import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Search, Filter, Calendar, User, Database, ExternalLink } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface AuditLogEntry {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  timestamp: string;
  user?: {
    email: string | null;
  } | null;
}

export const AuditLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('all');
  const [selectedEntityType, setSelectedEntityType] = useState('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  });
  const [actions, setActions] = useState<string[]>([]);
  const [entityTypes, setEntityTypes] = useState<string[]>([]);

  const logsPerPage = 20;

  const fetchAuditLogs = async (page = 1) => {
    try {
      setLoading(true);

      // Check if current user is admin
      const { data: isAdminResult, error: adminError } = await supabase.rpc('is_admin');
      if (adminError || !isAdminResult) {
        toast.error('You must be an admin to view audit logs.');
        return;
      }

      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          user:users(email)
        `, { count: 'exact' })
        .order('timestamp', { ascending: false })
        .range((page - 1) * logsPerPage, page * logsPerPage - 1);

      // Apply search filter
      if (searchTerm) {
        query = query.or(`action.ilike.%${searchTerm}%,entity_type.ilike.%${searchTerm}%`);
      }

      // Apply action filter
      if (selectedAction !== 'all') {
        query = query.eq('action', selectedAction);
      }

      // Apply entity type filter
      if (selectedEntityType !== 'all') {
        query = query.eq('entity_type', selectedEntityType);
      }

      // Apply date range filter
      if (dateRange.start) {
        query = query.gte('timestamp', new Date(dateRange.start).toISOString());
      }

      if (dateRange.end) {
        // Set end time to end of day
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        query = query.lte('timestamp', endDate.toISOString());
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching audit logs:', error);
        toast.error('Failed to fetch audit logs');
        return;
      }

      setLogs(data || []);
      setTotalPages(Math.ceil((count || 0) / logsPerPage));
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error('Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      // Fetch distinct actions
      const { data: actionsData, error: actionsError } = await supabase
        .from('audit_logs')
        .select('action')
        .neq('action', null);

      if (!actionsError && actionsData) {
        const uniqueActions = [...new Set(actionsData.map(item => item.action))];
        setActions(uniqueActions);
      }

      // Fetch distinct entity types
      const { data: entityTypesData, error: entityTypesError } = await supabase
        .from('audit_logs')
        .select('entity_type')
        .neq('entity_type', null);

      if (!entityTypesError && entityTypesData) {
        const uniqueEntityTypes = [...new Set(entityTypesData.map(item => item.entity_type))];
        setEntityTypes(uniqueEntityTypes);
      }
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
      case 'insert':
        return 'default';
      case 'update':
        return 'secondary';
      case 'delete':
        return 'destructive';
      case 'login':
      case 'logout':
        return 'outline';
      default:
        return 'default';
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchAuditLogs(1);
  };

  useEffect(() => {
    fetchAuditLogs(currentPage);
    fetchFilters();
  }, [currentPage]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Audit Log Viewer
          </CardTitle>
          <CardDescription>
            View and search system audit logs for security and compliance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search actions or entity types..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            
            <Select value={selectedAction} onValueChange={setSelectedAction}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {actions.map(action => (
                  <SelectItem key={action} value={action}>
                    {action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedEntityType} onValueChange={setSelectedEntityType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Entities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                {entityTypes.map(entityType => (
                  <SelectItem key={entityType} value={entityType}>
                    {entityType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button onClick={handleSearch} variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="text-sm">
                            {format(parseISO(log.timestamp), 'MMM dd, yyyy')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(parseISO(log.timestamp), 'HH:mm:ss')}
                          </div>
                        </TableCell>
                        <TableCell>
                          {log.user?.email ? (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{log.user.email}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">System</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getActionBadgeVariant(log.action)}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{log.entity_type}</div>
                          {log.entity_id && (
                            <div className="text-xs text-muted-foreground font-mono">
                              {log.entity_id.substring(0, 8)}...
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {log.details ? (
                            <div className="max-w-xs">
                              <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                                {JSON.stringify(log.details, null, 2).substring(0, 100)}
                                {JSON.stringify(log.details, null, 2).length > 100 ? '...' : ''}
                              </pre>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{log.ip_address || 'N/A}</div>
                          {log.user_agent && (
                            <div className="text-xs text-muted-foreground truncate max-w-[120px]">
                              {log.user_agent.substring(0, 20)}...
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {logs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No audit logs found matching your criteria
                </div>
              )}
              
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};