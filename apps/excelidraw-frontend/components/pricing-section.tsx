
"use client"
import React, { useState } from 'react';
import { Check, Code, Zap, Shield, Users, Database, GitBranch } from 'lucide-react';

type BillingCycle = 'monthly' | 'yearly';

interface Plan {
  name: string;
  id: string;
  subtitle: string;
  monthlyPrice: number | null;
  yearlyPrice: number | null;
  description: string;
  icon: React.ReactNode;
  features: string[];
  cta: string;
  popular: boolean;
}

const PricingSection: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);

  const plans: Plan[] = [
    {
      name: 'Developer',
      id: 'dev',
      subtitle: 'For individual developers',
      monthlyPrice: 0,
      yearlyPrice: 0,
      description: 'Perfect for prototyping and personal projects',
      icon: <Code className="w-6 h-6" />,
      features: [
        'Up to 5 canvases',
        'Real-time collaboration',
        'Vector & raster support',
        'Basic version control',
        'Community support',
        'Export to PNG/SVG/PDF',
        'Public API access'
      ],
      cta: 'Start Building',
      popular: false
    },
    {
      name: 'Professional',
      id: 'pro',
      subtitle: 'For growing teams',
      monthlyPrice: 29,
      yearlyPrice: 290,
      description: 'Advanced features for production workflows',
      icon: <Zap className="w-6 h-6" />,
      features: [
        'Unlimited canvases',
        'Advanced collaboration',
        'Custom plugins & integrations',
        'Git-based version control',
        'Priority support',
        'White-label exports',
        'Webhook notifications',
        'Advanced API rate limits',
        'SSO integration'
      ],
      cta: 'Scale Up',
      popular: true
    },
    {
      name: 'Enterprise',
      id: 'enterprise',
      subtitle: 'For large organizations',
      monthlyPrice: null,
      yearlyPrice: null,
      description: 'Custom solutions with dedicated infrastructure',
      icon: <Shield className="w-6 h-6" />,
      features: [
        'Unlimited everything',
        'On-premise deployment',
        'Custom integrations',
        'Dedicated support engineer',
        'SLA guarantees',
        'Advanced security controls',
        'Custom compliance',
        'Multi-region deployment',
        'Private cloud options'
      ],
      cta: 'Contact Sales',
      popular: false
    }
  ];

  const getPrice = (plan: Plan): string => {
    if (plan.monthlyPrice === null) return 'Custom';
    if (plan.monthlyPrice === 0) return 'Free';
    const price = billingCycle === 'monthly' ? plan.monthlyPrice : Math.floor(plan.yearlyPrice! / 12);
    return `${price}`;
  };

  const getSavings = (plan: Plan): number | null => {
    if (plan.monthlyPrice === null || plan.monthlyPrice === 0 || plan.yearlyPrice === null) return null;
    const monthlyCost = plan.monthlyPrice * 12;
    const savings = Math.round(((monthlyCost - plan.yearlyPrice) / monthlyCost) * 100);
    return savings;
  };

  return (
    <div className="bg-[#0a0a0a] text-white min-h-screen py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-light tracking-tight mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Simple, Developer-First Pricing
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8 font-mono">
            Built by developers, for developers. No hidden fees, no vendor lock-in.
          </p>
          
          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-[#0a0a0a] rounded-lg p-1 border cursor-pointer border-gray-800">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-md text-sm font-medium cursor-pointer transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-md text-sm font-medium cursor-pointer transition-all ${
                billingCycle === 'yearly'
                  ? 'bg-white text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Yearly
              <span className="ml-2 text-xs bg-green-500 text-black px-2 py-1 rounded-full">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.id}
              onMouseEnter={() => setHoveredPlan(plan.id)}
              onMouseLeave={() => setHoveredPlan(null)}
              className={`relative bg-[#0a0a0a] border rounded-2xl p-8 transition-all duration-300 ${
                plan.popular
                  ? 'border-white shadow-2xl scale-105'
                  : 'border-gray-800 hover:border-gray-700'
              } ${
                hoveredPlan === plan.id ? 'transform -translate-y-2' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-white text-black px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="flex items-center mb-6">
                <div className="p-2 bg-black rounded-lg mr-4">
                  {plan.icon}
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{plan.name}</h3>
                  <p className="text-gray-400 text-sm font-mono">{plan.subtitle}</p>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline">
                  <span className="text-4xl font-light">
                    {getPrice(plan)}
                  </span>
                  {plan.monthlyPrice !== null && plan.monthlyPrice > 0 && (
                    <span className="text-gray-400 ml-2 font-mono">/month</span>
                  )}
                </div>
                {billingCycle === 'yearly' && getSavings(plan) && (
                  <p className="text-green-400 text-sm mt-1 font-mono">
                    Save {getSavings(plan)}% annually
                  </p>
                )}
                <p className="text-gray-400 mt-2 text-sm">{plan.description}</p>
              </div>

              <button
                className={`w-full py-3 px-4 rounded-lg font-medium cursor-pointer transition-all mb-8 ${
                  plan.popular
                    ? 'bg-white text-black hover:bg-gray-200'
                    : 'bg-[#08080b] text-white hover:bg-[#08181b] border border-gray-700'
                }`}
              >
                {plan.cta}
              </button>

              <div className="space-y-3">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start">
                    <Check className="w-4 h-4 text-green-400 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-300 text-sm font-mono">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-16 pt-8 border-t border-gray-800">
          <p className="text-gray-400 font-mono">
             &copy; PaperlessDraw. All rights reserved. 2025
          </p>
        </div>
      </div>
    </div>
  );
};

export default PricingSection;