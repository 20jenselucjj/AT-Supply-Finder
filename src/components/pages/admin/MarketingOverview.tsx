import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Percent, 
  Calendar, 
  Users, 
  Eye, 
  MessageSquare, 
  Send, 
  Plus, 
  Edit, 
  Trash2 
} from 'lucide-react';

export const MarketingOverview: React.FC = () => {
  const campaigns = [
    {
      id: 1,
      name: 'Summer Sale 2023',
      status: 'active',
      audience: 'All Users',
      startDate: '2023-06-01',
      endDate: '2023-06-30',
      metrics: {
        sent: 12500,
        opened: 8750,
        clicked: 3250
      }
    },
    {
      id: 2,
      name: 'New User Welcome',
      status: 'draft',
      audience: 'New Users',
      startDate: '2023-06-15',
      endDate: '2023-07-15',
      metrics: {
        sent: 0,
        opened: 0,
        clicked: 0
      }
    },
    {
      id: 3,
      name: 'Product Launch',
      status: 'completed',
      audience: 'Active Users',
      startDate: '2023-05-01',
      endDate: '2023-05-31',
      metrics: {
        sent: 8900,
        opened: 6230,
        clicked: 1890
      }
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Campaigns</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Active campaigns</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coupons</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Active coupons</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5,230</div>
            <p className="text-xs text-muted-foreground">Total subscribers</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Open Rate</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">70%</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email Campaigns</CardTitle>
          <CardDescription>Manage your email marketing campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between">
              <div>
                <h3 className="font-medium">Active Campaigns</h3>
                <p className="text-sm text-muted-foreground">Manage and track your email campaigns</p>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Campaign
              </Button>
            </div>
            
            <div className="space-y-3">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{campaign.name}</h4>
                      <Badge variant={campaign.status === 'active' ? 'default' : campaign.status === 'completed' ? 'secondary' : 'outline'}>
                        {campaign.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {campaign.audience} • {campaign.startDate} to {campaign.endDate}
                    </p>
                    <div className="flex gap-4 mt-2 text-xs">
                      <span>Sent: {campaign.metrics.sent.toLocaleString()}</span>
                      <span>Opened: {campaign.metrics.opened.toLocaleString()}</span>
                      <span>Clicked: {campaign.metrics.clicked.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Send className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create New Campaign</CardTitle>
            <CardDescription>Set up a new email marketing campaign</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Campaign Name</label>
                <Input placeholder="e.g., Summer Sale 2023" />
              </div>
              <div>
                <label className="text-sm font-medium">Subject Line</label>
                <Input placeholder="e.g., Exclusive Summer Deals Inside!" />
              </div>
              <div>
                <label className="text-sm font-medium">Audience</label>
                <select className="w-full mt-1 p-2 border rounded-md">
                  <option>All Users</option>
                  <option>New Users</option>
                  <option>Active Users</option>
                  <option>Inactive Users</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Email Content</label>
                <Textarea placeholder="Write your email content here..." rows={6} />
              </div>
              <Button className="w-full">
                <Mail className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Coupons & Promotions</CardTitle>
            <CardDescription>Manage discount codes and special offers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <div>
                  <h3 className="font-medium">Active Coupons</h3>
                  <p className="text-sm text-muted-foreground">Manage discount codes</p>
                </div>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  New Coupon
                </Button>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">SUMMER20</h4>
                    <p className="text-sm text-muted-foreground">20% off orders over $50</p>
                  </div>
                  <Badge>Active</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">WELCOME10</h4>
                    <p className="text-sm text-muted-foreground">10% off first purchase</p>
                  </div>
                  <Badge>Active</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">FREESHIP</h4>
                    <p className="text-sm text-muted-foreground">Free shipping on all orders</p>
                  </div>
                  <Badge variant="secondary">Expired</Badge>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="font-medium mb-2">Create New Coupon</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Code</label>
                    <Input placeholder="e.g., SAVE25" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Discount</label>
                    <Input placeholder="e.g., 25%" />
                  </div>
                  <Button className="w-full">
                    <Percent className="h-4 w-4 mr-2" />
                    Create Coupon
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MarketingOverview;