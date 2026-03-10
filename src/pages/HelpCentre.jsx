import { useState } from 'react'

export default function HelpCentre() {
  const [expandedFAQ, setExpandedFAQ] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('faq')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: 'general',
    message: '',
    priority: 'medium',
  })
  const [submitLoading, setSubmitLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // FAQ Data
  const faqs = [
    {
      id: 1,
      category: 'Getting Started',
      question: 'How do I set up my portfolio?',
      answer: 'To set up your portfolio, navigate to the Dashboard and click "Add Asset". You can manually enter your holdings or import them from a CSV file. Enter the asset name, quantity, and purchase price to get started.',
    },
    {
      id: 2,
      category: 'Getting Started',
      question: 'What assets can I track?',
      answer: 'You can track stocks, bonds, cryptocurrencies, real estate, commodities, and more. Our platform supports all major asset classes and thousands of securities worldwide.',
    },
    {
      id: 3,
      category: 'Portfolio Management',
      question: 'How is my net worth calculated?',
      answer: 'Net worth is calculated by summing the current market value of all your assets and subtracting your liabilities. Market values are updated in real-time using current market prices.',
    },
    {
      id: 4,
      category: 'Portfolio Management',
      question: 'Can I track multiple portfolios?',
      answer: 'Yes, you can create and manage multiple portfolios. This is useful for tracking different investment strategies, family members\' portfolios, or personal vs. business assets.',
    },
    {
      id: 5,
      category: 'Budgeting',
      question: 'How do I set a monthly budget?',
      answer: 'Go to the Dashboard and find the Budget section. Click "Update Budget" and enter your desired monthly budget. The system will track your spending against this budget and alert you when you\'re approaching your limit.',
    },
    {
      id: 6,
      category: 'Budgeting',
      question: 'How can I categorize my expenses?',
      answer: 'Our system automatically categorizes transactions into categories like Food, Transport, Entertainment, Utilities, etc. You can manually recategorize transactions or create custom categories in your settings.',
    },
    {
      id: 7,
      category: 'Analytics & Insights',
      question: 'What is the Wellness Score?',
      answer: 'The Wellness Score is a comprehensive metric (0-100) that evaluates your financial health based on factors like portfolio diversification, emergency fund coverage, debt-to-asset ratio, and savings rate.',
    },
    {
      id: 8,
      category: 'Analytics & Insights',
      question: 'How are financial recommendations generated?',
      answer: 'Recommendations are generated using AI analysis of your portfolio, spending patterns, savings rate, and financial goals. Our advisory system examines thousands of data points to provide personalized suggestions.',
    },
    {
      id: 9,
      category: 'Security',
      question: 'Is my financial data secure?',
      answer: 'Yes. We use bank-level encryption (AES-256) for all data in transit and at rest. Your data is never shared with third parties, and we comply with international security standards.',
    },
    {
      id: 10,
      category: 'Security',
      question: 'Should I enable two-factor authentication?',
      answer: 'Yes, we strongly recommend enabling 2FA. It adds an extra security layer by requiring a second form of verification when logging in, protecting your account from unauthorized access.',
    },
    {
      id: 11,
      category: 'Transactions',
      question: 'Can I import transactions from my bank?',
      answer: 'We are working to incorporate direct bank connections. In the meantime, you can manually upload CSV files.',
    },
    {
      id: 12,
      category: 'Transactions',
      question: 'Are there any fees for using this platform?',
      answer: 'No, DeFi Wealth Hub is completely free. We don\'t charge any subscription fees, transaction fees, or asset management fees. All features are available to all users.',
    },
  ]

  // Knowledge Base Articles
  const articles = [
    {
      id: 1,
      title: 'Investment Diversification Strategies',
      category: 'Portfolio Management',
      readTime: '5 min',
      views: 2341,
    },
    {
      id: 2,
      title: 'Understanding Asset Allocation',
      category: 'Education',
      readTime: '7 min',
      views: 1893,
    },
    {
      id: 3,
      title: 'Getting Started with Cryptocurrency',
      category: 'Education',
      readTime: '6 min',
      views: 5621,
    },
    {
      id: 4,
      title: 'How to Build an Emergency Fund',
      category: 'Financial Planning',
      readTime: '4 min',
      views: 3456,
    },
    {
      id: 5,
      title: 'Tax-Efficient Investing Tips',
      category: 'Taxes',
      readTime: '8 min',
      views: 2234,
    },
    {
      id: 6,
      title: 'Rebalancing Your Portfolio',
      category: 'Portfolio Management',
      readTime: '5 min',
      views: 1567,
    },
  ]

  // Filter FAQs based on search
  const filteredFAQs = faqs.filter(
    faq =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Show message
  const showMessage = (message, isError = false) => {
    if (isError) {
      setErrorMessage(message)
      setTimeout(() => setErrorMessage(''), 5000)
    } else {
      setSuccessMessage(message)
      setTimeout(() => setSuccessMessage(''), 5000)
    }
  }

  // Handle form input
  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Handle form submission
  const handleSubmitQuery = async (e) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      showMessage('Please fill in all required fields', true)
      return
    }

    setSubmitLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Here you would typically send this to your backend
      console.log('Support ticket submitted:', formData)
      
      showMessage('Your query has been submitted successfully! We will reply within 3 business days.')
      setFormData({
        name: '',
        email: '',
        subject: '',
        category: 'general',
        message: '',
        priority: 'medium',
      })
    } catch (error) {
      showMessage(error.message || 'Failed to submit query', true)
    } finally {
      setSubmitLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Help Centre</h1>
        <p className="text-gray-500 mt-1">Get answers to your questions and manage support requests</p>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
          <p className="text-sm font-medium text-green-800">✓ {successMessage}</p>
        </div>
      )}
      {errorMessage && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm font-medium text-red-800">✕ {errorMessage}</p>
        </div>
      )}

      {/* Support Status Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-3 w-3 rounded-full bg-green-500">
            <span className="animate-pulse absolute h-3 w-3 rounded-full bg-green-400" />
          </div>
          <div>
            <p className="font-medium text-blue-900">Support Status: All Systems Operational</p>
            <p className="text-sm text-blue-700">Average response time: 4 hours</p>
          </div>
        </div>
      </div>

      {/* Quick Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Search Help Articles
        </label>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search FAQs, articles, and topics..."
          className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:bg-white transition-all"
        />
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-20 rounded-2xl border border-white/70 bg-white/70 p-2 backdrop-blur-xl">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('faq')}
            className={`px-5 py-2.5 text-sm font-semibold transition rounded-xl ${
              activeTab === 'faq'
                ? 'bg-teal-500 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            FAQ
          </button>
          <button
            onClick={() => setActiveTab('support')}
            className={`px-5 py-2.5 text-sm font-semibold transition rounded-xl ${
              activeTab === 'support'
                ? 'bg-teal-500 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Raise a Query
          </button>
          <button
            onClick={() => setActiveTab('articles')}
            className={`px-5 py-2.5 text-sm font-semibold transition rounded-xl ${
              activeTab === 'articles'
                ? 'bg-teal-500 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Knowledge Base
          </button>
        </div>
      </div>

      {/* FAQ Section */}
      {activeTab === 'faq' && (
        <div className="space-y-3">
          {filteredFAQs.length > 0 ? (
            filteredFAQs.map((faq) => (
              <div key={faq.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
                >
                  <div className="flex-1 text-left">
                    <p className="text-xs font-medium text-teal-600 mb-1">{faq.category}</p>
                    <p className="font-medium text-gray-900">{faq.question}</p>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ml-4 ${
                      expandedFAQ === faq.id ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </button>

                {expandedFAQ === faq.id && (
                  <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <p className="text-sm text-gray-700 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500">No matching questions found. Try a different search.</p>
            </div>
          )}
        </div>
      )}

      {/* Support Query Form */}
      {activeTab === 'support' && (
        <div className="space-y-6">
          {/* Info Box */}
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zm-11-1a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-medium text-blue-900">We're here to help!</p>
                <p className="text-sm text-blue-700 mt-1">Submit your query below and our support team will respond within 3 business days. For urgent issues, please select "High" priority.</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmitQuery} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                placeholder="Your name"
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:bg-white transition-all"
                disabled={submitLoading}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleFormChange}
                placeholder="your.email@example.com"
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:bg-white transition-all"
                disabled={submitLoading}
              />
            </div>

            {/* Category and Priority Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleFormChange}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                  disabled={submitLoading}
                >
                  <option value="general">General Inquiry</option>
                  <option value="technical">Technical Issue</option>
                  <option value="account">Account & Security</option>
                  <option value="billing">Billing & Features</option>
                  <option value="feature">Feature Request</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleFormChange}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                  disabled={submitLoading}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleFormChange}
                placeholder="Brief subject of your query"
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:bg-white transition-all"
                disabled={submitLoading}
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message *
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleFormChange}
                placeholder="Please describe your issue in detail..."
                rows="6"
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:bg-white transition-all resize-none"
                disabled={submitLoading}
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={submitLoading}
                className="bg-teal-500 hover:bg-teal-600 active:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                {submitLoading ? 'Submitting...' : 'Submit Query'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Knowledge Base Section */}
      {activeTab === 'articles' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 mb-4">Popular articles and guides</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {articles.map((article) => (
              <button
                key={article.id}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-teal-500 transition text-left"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-medium text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full">
                    {article.category}
                  </span>
                  <span className="text-xs text-gray-400">{article.readTime}</span>
                </div>
                <p className="font-medium text-gray-900 mb-2 group-hover:text-teal-600">{article.title}</p>
                <p className="text-xs text-gray-500">{article.views.toLocaleString()} views</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Additional Resources */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Additional Resources</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a
            href="#"
            className="flex items-center gap-3 p-4 bg-white/70 rounded-lg hover:bg-white transition"
          >
            <svg className="w-5 h-5 text-indigo-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-900">Video Tutorials</p>
              <p className="text-xs text-gray-500">Watch how-to videos</p>
            </div>
          </a>

          <a
            href="#"
            className="flex items-center gap-3 p-4 bg-white/70 rounded-lg hover:bg-white transition"
          >
            <svg className="w-5 h-5 text-indigo-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.5 1A1.5 1.5 0 001 2.5v15A1.5 1.5 0 002.5 19h15a1.5 1.5 0 001.5-1.5v-15A1.5 1.5 0 0017.5 1h-15zm0 1h15v15h-15v-15z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-900">Documentation</p>
              <p className="text-xs text-gray-500">Full API documentation</p>
            </div>
          </a>

          <a
            href="#"
            className="flex items-center gap-3 p-4 bg-white/70 rounded-lg hover:bg-white transition"
          >
            <svg className="w-5 h-5 text-indigo-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zm10-4h2a1 1 0 011 1v10a1 1 0 01-1 1h-2a1 1 0 01-1-1V7a1 1 0 011-1z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-900">Community Forum</p>
              <p className="text-xs text-gray-500">Ask the community</p>
            </div>
          </a>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Direct Contact</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Email</p>
            <p className="font-medium text-gray-900">support@defiwealth.hub</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Live Chat</p>
            <p className="font-medium text-teal-600 cursor-pointer hover:text-teal-700">Start a conversation</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Business Hours</p>
            <p className="font-medium text-gray-900">Mon-Fri, 9am-6pm (UTC)</p>
          </div>
        </div>
      </div>
    </div>
  )
}

