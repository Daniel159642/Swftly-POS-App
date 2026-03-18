export default {
    title: 'Swftly Docs',
    description: 'API & Feature Documentation',
    themeConfig: {
        nav: [
            { text: 'Home', link: '/' },
            { text: 'Overview', link: '/overview' }
        ],
        sidebar: [
            {
                text: 'Getting Started',
                items: [
                    { text: 'Overview', link: '/overview' }
                ]
            },
            {
                text: 'Core Features',
                items: [
                    { text: 'POS Core', link: '/features/pos_core' },
                    { text: 'Customer Program', link: '/features/customer_program' },
                    { text: 'Inventory', link: '/features/inventory' },
                    { text: 'Shipments', link: '/features/shipments' }
                ]
            },
            {
                text: 'Management & Data',
                items: [
                    { text: 'Accounting', link: '/features/accounting_subsystem' },
                    { text: 'Employees & Users', link: '/features/employees_users' },
                    { text: 'Statistics', link: '/features/statistics' },
                    { text: 'Database Tables', link: '/features/tables' },
                    { text: 'Settings', link: '/features/settings' }
                ]
            },
            {
                text: 'Integrations',
                items: [
                    { text: 'Calendar Integration', link: '/features/calendar' },
                    { text: 'Notifications', link: '/features/notifications' }
                ]
            }
        ],
        socialLinks: [
            { icon: 'github', link: 'https://github.com/swiftly-pos/core' }
        ]
    }
}
