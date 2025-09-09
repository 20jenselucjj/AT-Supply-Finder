import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, BarChart3, PieChart, TrendingUp, FileText } from 'lucide-react';

export const ReportsOverview: React.FC = () => {
  const reports = [
    {
      id: 1,
      title: 'Sales Report',
      description: 'Detailed sales data and revenue analysis',
      icon: <BarChart3 className="h-5 w-5" />,
      lastGenerated: '2023-06-15'
    },
    {
      id: 2,
      title: 'User Activity Report',
      description: 'User engagement and behavior analytics',
      icon: <PieChart className="h-5 w-5" />,
      lastGenerated: '2023-06-14'
    },
    {
      id: 3,
      title: 'Product Performance',
      description: 'Product sales and popularity metrics',
      icon: <TrendingUp className="h-5 w-5" />,
      lastGenerated: '2023-06-10'
    },
    {
      id: 4,
      title: 'Inventory Report',
      description: 'Stock levels and reorder recommendations',
      icon: <FileText className="h-5 w-5" />,
      lastGenerated: '2023-06-12'
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Reports Overview</CardTitle>
          <CardDescription>Generate and download detailed reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {reports.map((report) => (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{report.title}</CardTitle>
                  {report.icon}
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{report.description}</p>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-muted-foreground">
                      Last: {report.lastGenerated}
                    </span>
                    <Button variant="outline" size="sm">
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custom Report Generator</CardTitle>
          <CardDescription>Create custom reports based on your specific needs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium">Report Type</label>
                <select className="w-full mt-1 p-2 border rounded-md">
                  <option>Sales Data</option>
                  <option>User Analytics</option>
                  <option>Product Performance</option>
                  <option>Inventory Status</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium">Date Range</label>
                <select className="w-full mt-1 p-2 border rounded-md">
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                  <option>Last Quarter</option>
                  <option>Last Year</option>
                </select>
              </div>
            </div>
            <Button className="self-start">
              <BarChart3 className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsOverview;