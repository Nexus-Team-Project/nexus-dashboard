import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import nexusWideLogo from '../assets/logos/Nexus_wide_logo_blak.png';
import nexusWideLogoAnimated from '../assets/logos/Nexus_Wide_Logo_Animation_Black_Whithout_Slogan.gif';

interface Endpoint {
  id: string;
  method: 'POST' | 'GET' | 'PUT' | 'DELETE';
  title: string;
  description: string;
}

const ApiDocs = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('create-order');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['orders']);
  const [isCopied, setIsCopied] = useState(false);
  const [isLogoHovered, setIsLogoHovered] = useState(false);

  const endpoints: Endpoint[] = [
    {
      id: 'create-order',
      method: 'POST',
      title: 'Create Order',
      description: 'Creates an order. Use this endpoint to create manual orders for phone or email sales.',
    },
    {
      id: 'get-order',
      method: 'GET',
      title: 'Get Order',
      description: 'Retrieves details of a specific order by ID.',
    },
    {
      id: 'update-order',
      method: 'PUT',
      title: 'Update Order',
      description: 'Updates an existing order with new information.',
    },
    {
      id: 'search-orders',
      method: 'POST',
      title: 'Search Orders',
      description: 'Search and filter orders based on various criteria.',
    },
  ];

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const codeExamples: Record<string, { title: string; code: string; lines: number }> = {
    'create-order': {
      title: 'Create Order',
      code: `curl -X POST \\
  'https://www.api.example.com/v1/orders' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: <AUTH_TOKEN>' \\
  --data-binary '{
    "order": {
      "buyerInfo": {
        "contactId": "02b9675a-c6",
        "email": "johndoe@email.com",
        "memberId": "02b9675a-c6f"
      },
      "priceSummary": {
        "subtotal": {
          "amount": "28.00"
        }
      }
    }
  }'`,
      lines: 15,
    },
    'get-order': {
      title: 'Get Order',
      code: `curl -X GET \\
  'https://www.api.example.com/v1/orders/{orderId}' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: <AUTH_TOKEN>'`,
      lines: 4,
    },
    'update-order': {
      title: 'Update Order',
      code: `curl -X PUT \\
  'https://www.api.example.com/v1/orders/{orderId}' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: <AUTH_TOKEN>' \\
  --data-binary '{
    "order": {
      "status": "FULFILLED",
      "trackingNumber": "1Z999AA10123456784"
    }
  }'`,
      lines: 10,
    },
    'search-orders': {
      title: 'Search Orders',
      code: `curl -X POST \\
  'https://www.api.example.com/v1/orders/search' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: <AUTH_TOKEN>' \\
  --data-binary '{
    "query": {
      "filter": {
        "status": "APPROVED",
        "createdDate": {
          "$gte": "2024-01-01"
        }
      },
      "sort": [{"createdDate": "desc"}],
      "paging": {
        "limit": 50,
        "offset": 0
      }
    }
  }'`,
      lines: 18,
    },
  };

  const getCurrentCode = () => {
    return codeExamples[activeSection] || codeExamples['create-order'];
  };

  const renderCodeWithSyntax = (code: string) => {
    return code
      .replace(/curl/g, '<span class="text-purple-400">curl</span>')
      .replace(/POST|GET|PUT|DELETE/g, (match) => `<span class="text-green-400">${match}</span>`)
      .replace(/'([^']+)'/g, (match) => `<span class="text-yellow-400">${match}</span>`)
      .replace(/("[\w]+"):/g, (match) => `<span class="text-blue-400">${match}</span>`);
  };

  const copyCode = () => {
    const currentExample = getCurrentCode();
    navigator.clipboard.writeText(currentExample.code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'POST':
        return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'GET':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800';
      case 'PUT':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'DELETE':
        return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800';
      default:
        return '';
    }
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'POST':
        return 'P';
      case 'GET':
        return 'G';
      case 'PUT':
        return 'U';
      case 'DELETE':
        return 'D';
      default:
        return '';
    }
  };

  const getMethodBadgeColor = (method: string) => {
    switch (method) {
      case 'POST':
        return 'bg-green-500/10 text-green-600';
      case 'GET':
        return 'bg-purple-500/10 text-purple-600';
      case 'PUT':
        return 'bg-blue-500/10 text-blue-600';
      case 'DELETE':
        return 'bg-red-500/10 text-red-600';
      default:
        return '';
    }
  };

  return (
    <div className={isDarkMode ? 'dark' : ''} dir="ltr">
      {/* Header */}
      <header className="bg-white dark:bg-card-dark border-b border-slate-200 dark:border-slate-800 h-16 flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Back to Dashboard"
          >
            <span className="material-icons">arrow_back</span>
            <span className="text-sm font-medium">Dashboard</span>
          </button>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
          <div
            className="flex items-center pl-3 pr-6 py-1.5 rounded-lg cursor-pointer"
            onMouseEnter={() => setIsLogoHovered(true)}
            onMouseLeave={() => setIsLogoHovered(false)}
          >
            <img
              src={isLogoHovered ? nexusWideLogoAnimated : nexusWideLogo}
              alt="Nexus API Documentation"
              className="h-12 w-auto object-contain transition-opacity duration-300"
              key={isLogoHovered ? 'animated' : 'static'}
            />
          </div>
          <div className="relative ml-4">
            <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              search
            </span>
            <input
              className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-full text-sm w-64 focus:ring-2 focus:ring-primary outline-none"
              placeholder="Search documentation..."
              type="text"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="relative p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <span className="material-icons">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-card-dark"></span>
          </button>
          <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <span className="material-icons">headset_mic</span>
          </button>
          <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <span className="material-icons">group</span>
          </button>
          <button
            className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            onClick={() => setIsDarkMode(!isDarkMode)}
            title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
          >
            <span className="material-icons">{isDarkMode ? 'light_mode' : 'dark_mode'}</span>
          </button>
          <div className="flex items-center gap-2 ml-2 pl-4 border-l border-slate-200 dark:border-slate-700">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
              <span className="material-icons text-slate-500">person</span>
            </div>
          </div>
        </div>
      </header>

      <div className="w-full flex">
        {/* Sidebar */}
        <aside className="w-72 hidden md:block h-[calc(100vh-64px)] sticky top-16 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 overflow-y-auto custom-scrollbar p-6">
          <div className="mb-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
              API Reference
            </h3>
            <div className="flex p-1 bg-slate-200 dark:bg-slate-700 rounded-lg">
              <button className="flex-1 py-1 text-xs font-semibold bg-white dark:bg-slate-600 shadow-sm rounded-md text-primary dark:text-white">
                REST
              </button>
              <div className="relative flex-1 group">
                <button className="w-full py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-primary relative z-10">
                  SDK
                </button>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-lg z-50">
                  Coming Soon
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900 dark:border-t-slate-700"></div>
                </div>
              </div>
            </div>
          </div>

          <nav className="space-y-1">
            {/* Orders Category */}
            <div className="mb-4">
              <button
                onClick={() => toggleCategory('orders')}
                className="flex items-center gap-2 w-full text-sm font-semibold text-slate-900 dark:text-white mb-2 group"
              >
                <span
                  className={`material-icons-outlined text-sm transition-transform ${
                    expandedCategories.includes('orders') ? 'rotate-90' : ''
                  }`}
                >
                  chevron_right
                </span>
                Orders
              </button>
              {expandedCategories.includes('orders') && (
                <div className="pl-6 space-y-2 border-l border-slate-200 dark:border-slate-700 ml-2">
                  <a
                    className="block text-sm text-slate-600 dark:text-slate-400 hover:text-primary py-1"
                    href="#introduction"
                  >
                    Introduction
                  </a>
                  <a
                    className="block text-sm text-slate-600 dark:text-slate-400 hover:text-primary py-1"
                    href="#sample-flows"
                  >
                    Sample Flows
                  </a>
                  <a
                    className="block text-sm text-sm text-slate-600 dark:text-slate-400 hover:text-primary py-1"
                    href="#terminology"
                  >
                    Terminology
                  </a>
                  {endpoints.map((endpoint) => (
                    <a
                      key={endpoint.id}
                      className={`flex items-center gap-2 text-sm py-1 ${
                        activeSection === endpoint.id
                          ? 'text-primary font-medium bg-primary/5 -ml-6 pl-6 border-r-2 border-primary'
                          : 'text-slate-600 dark:text-slate-400 hover:text-primary'
                      }`}
                      href={`#${endpoint.id}`}
                      onClick={() => setActiveSection(endpoint.id)}
                    >
                      <span
                        className={`text-[10px] px-1 rounded font-bold ${getMethodBadgeColor(
                          endpoint.method
                        )}`}
                      >
                        {getMethodBadge(endpoint.method)}
                      </span>
                      {endpoint.title}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Products Category */}
            <div className="mb-4">
              <button
                onClick={() => toggleCategory('products')}
                className="flex items-center gap-2 w-full text-sm font-semibold text-slate-900 dark:text-white mb-2 group opacity-60"
              >
                <span
                  className={`material-icons-outlined text-sm transition-transform ${
                    expandedCategories.includes('products') ? 'rotate-90' : ''
                  }`}
                >
                  chevron_right
                </span>
                Products
              </button>
            </div>

            {/* Collections Category */}
            <div className="mb-4">
              <button
                onClick={() => toggleCategory('collections')}
                className="flex items-center gap-2 w-full text-sm font-semibold text-slate-900 dark:text-white mb-2 group opacity-60"
              >
                <span
                  className={`material-icons-outlined text-sm transition-transform ${
                    expandedCategories.includes('collections') ? 'rotate-90' : ''
                  }`}
                >
                  chevron_right
                </span>
                Collections
              </button>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 overflow-y-auto custom-scrollbar bg-white dark:bg-background-dark p-8 lg:p-12">
              {/* Create Order Endpoint */}
              <section id="create-order" className="mb-16">
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className={`text-sm font-bold px-2 py-1 rounded border ${getMethodColor(
                      'POST'
                    )}`}
                  >
                    POST
                  </span>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    Create Order
                  </h1>
                </div>
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                  Creates an order. Use this endpoint to create manual orders for phone or email
                  sales or to add orders from external systems (such as POS, marketplaces, or
                  legacy platforms). For standard online purchases, orders are created automatically
                  through the checkout flow.
                </p>

                <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-primary p-6 rounded-r-lg mb-10">
                  <div className="flex items-center gap-2 mb-3 text-primary font-bold">
                    <span className="material-icons-outlined">info</span>
                    Notes
                  </div>
                  <ul className="space-y-3 text-sm text-slate-700 dark:text-slate-300 list-disc pl-5">
                    <li>
                      Inventory is automatically reduced when the order is placed (default) or when
                      the order is paid. This can be configured via{' '}
                      <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded font-mono text-xs">
                        settings.orderApprovalStrategy
                      </code>
                      .
                    </li>
                    <li>A confirmation email is sent when the order is approved.</li>
                    <li>
                      If an item is digital,{' '}
                      <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded font-mono text-xs">
                        lineItems[i].itemType.preset: DIGITAL
                      </code>{' '}
                      must be provided.
                    </li>
                  </ul>
                </div>

                <div className="mb-12">
                  <h2 className="text-xl font-bold mb-6 pb-2 border-b border-slate-200 dark:border-slate-800">
                    Request Body Parameters
                  </h2>
                  <div className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-xl">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-800/50">
                        <tr>
                          <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                            Field
                          </th>
                          <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                            Type
                          </th>
                          <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                            Required
                          </th>
                          <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                            Description
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        <tr>
                          <td className="px-4 py-4 font-mono font-medium text-primary">order</td>
                          <td className="px-4 py-4 text-slate-500 dark:text-slate-400">Object</td>
                          <td className="px-4 py-4">
                            <span className="text-red-500 font-bold">Yes</span>
                          </td>
                          <td className="px-4 py-4 text-slate-600 dark:text-slate-400">
                            The order object to create.
                          </td>
                        </tr>
                        <tr className="bg-slate-50/50 dark:bg-slate-800/20">
                          <td className="px-4 py-4 font-mono font-medium text-primary pl-8">
                            .buyerInfo
                          </td>
                          <td className="px-4 py-4 text-slate-500 dark:text-slate-400">Object</td>
                          <td className="px-4 py-4">
                            <span className="text-red-500 font-bold">Yes</span>
                          </td>
                          <td className="px-4 py-4 text-slate-600 dark:text-slate-400">
                            Details about the customer purchasing the items.
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-4 font-mono font-medium text-primary pl-12">
                            ..email
                          </td>
                          <td className="px-4 py-4 text-slate-500 dark:text-slate-400">String</td>
                          <td className="px-4 py-4">
                            <span className="text-red-500 font-bold">Yes</span>
                          </td>
                          <td className="px-4 py-4 text-slate-600 dark:text-slate-400">
                            Customer's email address.
                          </td>
                        </tr>
                        <tr className="bg-slate-50/50 dark:bg-slate-800/20">
                          <td className="px-4 py-4 font-mono font-medium text-primary pl-12">
                            ..contactId
                          </td>
                          <td className="px-4 py-4 text-slate-500 dark:text-slate-400">String</td>
                          <td className="px-4 py-4">
                            <span className="text-slate-400">No</span>
                          </td>
                          <td className="px-4 py-4 text-slate-600 dark:text-slate-400">
                            Unique identifier for the contact.
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-4 font-mono font-medium text-primary pl-8">
                            .lineItems
                          </td>
                          <td className="px-4 py-4 text-slate-500 dark:text-slate-400">Array</td>
                          <td className="px-4 py-4">
                            <span className="text-red-500 font-bold">Yes</span>
                          </td>
                          <td className="px-4 py-4 text-slate-600 dark:text-slate-400">
                            List of items included in the order.
                          </td>
                        </tr>
                        <tr className="bg-slate-50/50 dark:bg-slate-800/20">
                          <td className="px-4 py-4 font-mono font-medium text-primary pl-8">
                            .priceSummary
                          </td>
                          <td className="px-4 py-4 text-slate-500 dark:text-slate-400">Object</td>
                          <td className="px-4 py-4">
                            <span className="text-slate-400">No</span>
                          </td>
                          <td className="px-4 py-4 text-slate-600 dark:text-slate-400">
                            Summary of order pricing including subtotal, tax, and total.
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mb-12">
                  <h2 className="text-xl font-bold mb-6 pb-2 border-b border-slate-200 dark:border-slate-800">
                    Response
                  </h2>
                  <div className="bg-slate-900 rounded-xl p-6 overflow-x-auto">
                    <pre className="text-sm text-slate-300 font-mono">
                      <code>
                        {`{
  "order": {
    "_id": "6a7e8b9c-0d1e-2f3a-4b5c-6d7e8f9a0b1c",
    "number": 10042,
    "buyerInfo": {
      "email": "johndoe@email.com",
      "contactId": "02b9675a-c6",
      "memberId": "02b9675a-c6f"
    },
    "lineItems": [...],
    "priceSummary": {
      "subtotal": {
        "amount": "28.00",
        "currency": "USD"
      }
    },
    "status": "APPROVED",
    "createdDate": "2024-02-07T10:30:00.000Z"
  }
}`}
                      </code>
                    </pre>
                  </div>
                </div>
              </section>

              {/* Get Order Endpoint */}
              <section id="get-order" className="mb-16 pt-8 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className={`text-sm font-bold px-2 py-1 rounded border ${getMethodColor(
                      'GET'
                    )}`}
                  >
                    GET
                  </span>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Get Order</h1>
                </div>
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                  Retrieves the details of an existing order by its unique identifier. This endpoint
                  returns comprehensive information about the order including buyer info, line items,
                  pricing, and fulfillment status.
                </p>

                <div className="mb-12">
                  <h2 className="text-xl font-bold mb-6 pb-2 border-b border-slate-200 dark:border-slate-800">
                    Path Parameters
                  </h2>
                  <div className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-xl">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-800/50">
                        <tr>
                          <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                            Parameter
                          </th>
                          <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                            Type
                          </th>
                          <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                            Description
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        <tr>
                          <td className="px-4 py-4 font-mono font-medium text-primary">orderId</td>
                          <td className="px-4 py-4 text-slate-500 dark:text-slate-400">String</td>
                          <td className="px-4 py-4 text-slate-600 dark:text-slate-400">
                            The unique identifier of the order to retrieve.
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              {/* Update Order Endpoint */}
              <section id="update-order" className="mb-16 pt-8 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className={`text-sm font-bold px-2 py-1 rounded border ${getMethodColor(
                      'PUT'
                    )}`}
                  >
                    PUT
                  </span>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    Update Order
                  </h1>
                </div>
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                  Updates an existing order with new information. You can modify buyer details, add
                  or remove line items, update pricing, and change order status.
                </p>
              </section>

              {/* Search Orders Endpoint */}
              <section id="search-orders" className="mb-16 pt-8 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className={`text-sm font-bold px-2 py-1 rounded border ${getMethodColor(
                      'POST'
                    )}`}
                  >
                    POST
                  </span>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    Search Orders
                  </h1>
                </div>
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                  Search and filter orders based on various criteria including date range, status,
                  customer information, and order totals. Supports pagination and sorting.
                </p>
              </section>
        </main>

        {/* Code Example Panel - Gray Strip */}
        <div className="w-72 lg:w-[450px] hidden lg:block h-[calc(100vh-64px)] sticky top-16 bg-slate-50 dark:bg-slate-900/50 border-l border-slate-200 dark:border-slate-800 overflow-y-auto custom-scrollbar p-8 pt-8">
            <div className="bg-[#0B1120] rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[calc(100vh-180px)]">
                  <div className="px-4 py-3 bg-slate-800 flex items-center justify-between border-b border-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 uppercase">
                        Example shown:
                      </span>
                      <div className="relative">
                        <button className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-3 py-1 rounded flex items-center gap-2 transition-colors">
                          {getCurrentCode().title}
                          <span className="material-icons-outlined text-xs">expand_more</span>
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-slate-500 font-mono">cURL</span>
                      <div className="relative group">
                        <button
                          onClick={copyCode}
                          className="text-slate-400 hover:text-white p-1 transition-colors relative z-10"
                        >
                          <span className="material-icons-outlined text-sm">
                            {isCopied ? 'check' : 'content_copy'}
                          </span>
                        </button>
                        <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-slate-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-lg z-50">
                          {isCopied ? 'Copied!' : 'Copy'}
                          <div className="absolute top-full right-4 -mt-1 border-4 border-transparent border-t-slate-900"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 p-4 font-mono text-xs leading-relaxed overflow-y-auto overflow-x-auto custom-scrollbar bg-[#0B1120] text-slate-300">
                    <div className="flex gap-4 min-w-max">
                      <div className="text-slate-600 text-right select-none pr-2 border-r border-slate-800 shrink-0">
                        {Array.from({ length: getCurrentCode().lines }, (_, i) => (
                          <div key={i}>{i + 1}</div>
                        ))}
                      </div>
                      <pre
                        className="whitespace-pre shrink-0 text-slate-300"
                        dangerouslySetInnerHTML={{ __html: renderCodeWithSyntax(getCurrentCode().code) }}
                      />
                    </div>
                  </div>
                  <div className="p-4 bg-slate-800/50 border-t border-slate-700">
                    <button className="w-full bg-primary hover:bg-primary/90 text-white py-2 rounded-lg font-bold text-sm transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                      <span className="material-icons-outlined text-sm">play_arrow</span>
                      Try it out
                    </button>
                  </div>
                </div>
        </div>
      </div>

      {/* Developer Assistant Button */}
      <button className="fixed bottom-6 right-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-full px-6 py-3 flex items-center gap-3 hover:scale-105 transition-transform z-50 group">
        <span className="material-icons-outlined text-primary group-hover:rotate-12 transition-transform">
          auto_awesome
        </span>
        <span className="font-bold text-primary dark:text-white text-sm">
          Developer Assistant
        </span>
      </button>
    </div>
  );
};

export default ApiDocs;
