import React, { useState } from 'react';
import {
  Card,
  InfoCard,
  StatCard,
  FeatureCard,
  TabContainer,
  Tab,
  TabContent,
  TabPanel,
  Accordion,
  AccordionItem,
  StatusBadge,
  NumberBadge,
  LoadingState,
  ProgressBar,
  Spinner
} from '../ui';

/**
 * Example component demonstrating the usage of reusable UI components
 * This file serves as a reference for how to implement the new UI library
 */
function UIComponentsExample() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);

  const sampleData = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    status: 'Active',
    orders: 45,
    revenue: 'Rp 12.500.000',
    growth: '+15%'
  };

  if (loading) {
    return (
      <div className="p-8">
        <LoadingState message="Loading components example..." size="lg" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">UI Components Example</h1>
        <p className="text-gray-600">Demonstration of reusable UI components</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Revenue"
          value={sampleData.revenue}
          change={sampleData.growth}
          changeType="positive"
          icon="💰"
          variant="success"
        />
        
        <StatCard
          title="Total Orders"
          value={sampleData.orders}
          change="+5"
          changeType="positive"
          icon="📦"
          variant="primary"
        />
        
        <StatCard
          title="Customer Status"
          value={sampleData.status}
          icon="👤"
          variant="info"
        />
      </div>

      {/* Tab Navigation Example */}
      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Tab Navigation Example</h2>
          <p className="text-gray-600">Different tab variants and content management</p>
        </div>

        <TabContainer 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          variant="underline"
        >
          <Tab 
            id="overview" 
            label="Overview" 
            icon="📊" 
          />
          <Tab 
            id="details" 
            label="Details" 
            badge={<NumberBadge count={3} variant="primary" size="xs" />}
          />
          <Tab 
            id="settings" 
            label="Settings" 
            icon="⚙️" 
          />
        </TabContainer>

        <TabContent activeTab={activeTab}>
          <TabPanel tabId="overview">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Overview Content</h3>
              
              {/* Info Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoCard
                  label="Full Name"
                  value={sampleData.name}
                  variant="primary"
                  icon="👤"
                />
                <InfoCard
                  label="Email Address"
                  value={sampleData.email}
                  copyable={true}
                  icon="📧"
                />
                <InfoCard
                  label="Status"
                  value={<StatusBadge status={sampleData.status} variant="success" />}
                  variant="success"
                  icon="✅"
                />
                <InfoCard
                  label="Total Orders"
                  value={sampleData.orders}
                  variant="info"
                  icon="📊"
                />
              </div>
            </div>
          </TabPanel>
          
          <TabPanel tabId="details">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Detailed Information</h3>
              
              {/* Accordion Example */}
              <Accordion allowMultiple={true} defaultExpanded={[0]}>
                <AccordionItem 
                  title="Personal Information"
                  icon="👤"
                  badge={<StatusBadge status="Complete" variant="success" size="sm" />}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <InfoCard label="Name" value={sampleData.name} />
                    <InfoCard label="Email" value={sampleData.email} copyable />
                  </div>
                </AccordionItem>
                
                <AccordionItem 
                  title="Order Statistics"
                  icon="📊"
                  badge={<NumberBadge count={sampleData.orders} variant="primary" size="sm" />}
                >
                  <div className="space-y-4 mt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Order Completion</span>
                      <span className="text-sm text-gray-900">85%</span>
                    </div>
                    <ProgressBar value={85} color="green" showLabel />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Customer Satisfaction</span>
                      <span className="text-sm text-gray-900">92%</span>
                    </div>
                    <ProgressBar value={92} color="blue" showLabel />
                  </div>
                </AccordionItem>
              </Accordion>
            </div>
          </TabPanel>
          
          <TabPanel tabId="settings">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Settings & Preferences</h3>
              
              {/* Feature Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FeatureCard
                  title="Export Data"
                  description="Download customer data in various formats"
                  icon="📤"
                  actions={[
                    { 
                      label: "Export CSV", 
                      onClick: () => alert('CSV Export'), 
                      variant: "primary" 
                    },
                    { 
                      label: "Export PDF", 
                      onClick: () => alert('PDF Export'), 
                      variant: "secondary" 
                    }
                  ]}
                />
                
                <FeatureCard
                  title="Notification Settings"
                  description="Configure email and SMS notifications"
                  icon="🔔"
                  actions={[
                    { 
                      label: "Configure", 
                      onClick: () => alert('Configure Notifications'), 
                      variant: "primary" 
                    }
                  ]}
                />
              </div>
            </div>
          </TabPanel>
        </TabContent>
      </Card>

      {/* Badge Examples */}
      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Badge Examples</h2>
          <p className="text-gray-600">Different types of badges and their usage</p>
        </div>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Status Badges</h3>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status="Active" variant="success" />
              <StatusBadge status="Pending" variant="warning" />
              <StatusBadge status="Inactive" variant="danger" />
              <StatusBadge status="Processing" variant="primary" />
              <StatusBadge status="Draft" variant="secondary" />
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Number Badges</h3>
            <div className="flex flex-wrap gap-2">
              <NumberBadge count={5} variant="primary" />
              <NumberBadge count={23} variant="success" />
              <NumberBadge count={150} max={99} variant="danger" />
              <NumberBadge count={0} showZero variant="secondary" />
            </div>
          </div>
        </div>
      </Card>

      {/* Loading Examples */}
      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading States</h2>
          <p className="text-gray-600">Different loading indicators and states</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Spinner</h3>
            <Spinner size="lg" color="blue" />
          </div>
          
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Loading with Message</h3>
            <LoadingState message="Processing..." type="dots" size="md" />
          </div>
          
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Progress Bar</h3>
            <ProgressBar value={65} showLabel animated color="green" />
          </div>
        </div>
      </Card>
      
      {/* Actions */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => setLoading(true)}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Simulate Loading
        </button>
        <button
          onClick={() => setLoading(false)}
          className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

export default UIComponentsExample;