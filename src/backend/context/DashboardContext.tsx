import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useCompany } from './CompanyContext';
import { useSettings } from './SettingsContext';
import { useAnalytics } from './AnalyticsContext';
// import { useStock } from './StockContext'; // TODO: Use when implementing functions
// import { useHR } from './HRContext'; // TODO: Use when implementing functions
// import { useBookings } from './BookingsContext'; // TODO: Use when implementing functions
// import { useFinance } from './FinanceContext'; // TODO: Use when implementing functions
// import { usePOS } from './POSContext'; // TODO: Use when implementing functions
import {
  DashboardCard,
  DashboardLayout,
  DashboardSettings,
  // ChartConfig,
  // TableConfig,
  // KPIConfig,
  // TextConfig,
  // CustomWidgetConfig,
  ReportTemplate,
  ReportGeneration,
  DashboardCardType,
  // DashboardFilter,
  DashboardFilterState,
  DEFAULT_DASHBOARD_SETTINGS,
  // CARD_SIZE_CONFIG,
  // CHART_COLORS,
  // MODULE_COLORS
} from '../interfaces/Dashboard';
import { FilterOptions, GroupByOptions } from '../functions/Analytics';

// ========== DASHBOARD CONTEXT TYPES ==========

interface DashboardContextType {
  // State
  loading: boolean;
  error: string | null;
  settings: DashboardSettings;
  activeLayout: DashboardLayout | null;
  filters: DashboardFilterState;
  
  // Layout Management
  createLayout: (layout: Omit<DashboardLayout, 'id' | 'createdAt' | 'updatedAt'>) => Promise<DashboardLayout>;
  updateLayout: (layoutId: string, updates: Partial<DashboardLayout>) => Promise<void>;
  deleteLayout: (layoutId: string) => Promise<void>;
  setActiveLayout: (layoutId: string) => Promise<void>;
  duplicateLayout: (layoutId: string, newName: string) => Promise<DashboardLayout>;
  
  // Card Management
  addCard: (card: Omit<DashboardCard, 'id' | 'lastUpdated'>) => Promise<DashboardCard>;
  updateCard: (cardId: string, updates: Partial<DashboardCard>) => Promise<void>;
  removeCard: (cardId: string) => Promise<void>;
  moveCard: (cardId: string, newPosition: { x: number; y: number }) => Promise<void>;
  resizeCard: (cardId: string, newSize: { w: number; h: number }) => Promise<void>;
  duplicateCard: (cardId: string) => Promise<DashboardCard>;
  
  // Data Management
  refreshCardData: (cardId: string) => Promise<void>;
  refreshAllCards: () => Promise<void>;
  getCardData: (card: DashboardCard) => Promise<any>;
  
  // Filter Management
  setFilter: (filterId: string, value: any) => Promise<void>;
  clearFilters: () => Promise<void>;
  applyFilters: () => Promise<void>;
  
  // Report Management
  generateReport: (templateId: string, filters?: FilterOptions, groupBy?: GroupByOptions) => Promise<ReportGeneration>;
  getReportTemplates: (module?: string) => Promise<ReportTemplate[]>;
  createReportTemplate: (template: Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ReportTemplate>;
  updateReportTemplate: (templateId: string, updates: Partial<ReportTemplate>) => Promise<void>;
  deleteReportTemplate: (templateId: string) => Promise<void>;
  
  // Settings Management
  updateSettings: (updates: Partial<DashboardSettings>) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  
  // Utility Functions
  getAvailableCardTypes: (module?: string) => DashboardCardType[];
  getDefaultLayout: (module: string) => DashboardLayout;
  exportLayout: (layoutId: string) => Promise<string>;
  importLayout: (layoutData: string) => Promise<DashboardLayout>;
}

// ========== DASHBOARD CARD TYPES ==========

const DASHBOARD_CARD_TYPES: DashboardCardType[] = [
  // Stock Cards
  {
    id: 'stock-kpi',
    name: 'Stock KPIs',
    description: 'Key performance indicators for stock management',
    icon: '📊',
    category: 'kpi',
    module: 'stock',
    configSchema: {},
    defaultConfig: {},
    component: 'StockKPICard'
  },
  {
    id: 'stock-chart',
    name: 'Stock Chart',
    description: 'Visual representation of stock data',
    icon: '📈',
    category: 'visualization',
    module: 'stock',
    configSchema: {},
    defaultConfig: {},
    component: 'StockChartCard'
  },
  {
    id: 'stock-table',
    name: 'Stock Table',
    description: 'Tabular view of stock data',
    icon: '📋',
    category: 'visualization',
    module: 'stock',
    configSchema: {},
    defaultConfig: {},
    component: 'StockTableCard'
  },
  
  // HR Cards
  {
    id: 'hr-kpi',
    name: 'HR KPIs',
    description: 'Key performance indicators for human resources',
    icon: '👥',
    category: 'kpi',
    module: 'hr',
    configSchema: {},
    defaultConfig: {},
    component: 'HRKPICard'
  },
  {
    id: 'hr-chart',
    name: 'HR Chart',
    description: 'Visual representation of HR data',
    icon: '📊',
    category: 'visualization',
    module: 'hr',
    configSchema: {},
    defaultConfig: {},
    component: 'HRChartCard'
  },
  {
    id: 'hr-table',
    name: 'HR Table',
    description: 'Tabular view of HR data',
    icon: '📋',
    category: 'visualization',
    module: 'hr',
    configSchema: {},
    defaultConfig: {},
    component: 'HRTableCard'
  },
  
  // Bookings Cards
  {
    id: 'bookings-kpi',
    name: 'Bookings KPIs',
    description: 'Key performance indicators for bookings',
    icon: '📅',
    category: 'kpi',
    module: 'bookings',
    configSchema: {},
    defaultConfig: {},
    component: 'BookingsKPICard'
  },
  {
    id: 'bookings-chart',
    name: 'Bookings Chart',
    description: 'Visual representation of bookings data',
    icon: '📈',
    category: 'visualization',
    module: 'bookings',
    configSchema: {},
    defaultConfig: {},
    component: 'BookingsChartCard'
  },
  {
    id: 'bookings-table',
    name: 'Bookings Table',
    description: 'Tabular view of bookings data',
    icon: '📋',
    category: 'visualization',
    module: 'bookings',
    configSchema: {},
    defaultConfig: {},
    component: 'BookingsTableCard'
  },
  
  // Finance Cards
  {
    id: 'finance-kpi',
    name: 'Finance KPIs',
    description: 'Key performance indicators for finance',
    icon: '💰',
    category: 'kpi',
    module: 'finance',
    configSchema: {},
    defaultConfig: {},
    component: 'FinanceKPICard'
  },
  {
    id: 'finance-chart',
    name: 'Finance Chart',
    description: 'Visual representation of finance data',
    icon: '📊',
    category: 'visualization',
    module: 'finance',
    configSchema: {},
    defaultConfig: {},
    component: 'FinanceChartCard'
  },
  {
    id: 'finance-table',
    name: 'Finance Table',
    description: 'Tabular view of finance data',
    icon: '📋',
    category: 'visualization',
    module: 'finance',
    configSchema: {},
    defaultConfig: {},
    component: 'FinanceTableCard'
  },
  
  // POS Cards
  {
    id: 'pos-kpi',
    name: 'POS KPIs',
    description: 'Key performance indicators for point of sale',
    icon: '🛒',
    category: 'kpi',
    module: 'pos',
    configSchema: {},
    defaultConfig: {},
    component: 'POSKPICard'
  },
  {
    id: 'pos-chart',
    name: 'POS Chart',
    description: 'Visual representation of POS data',
    icon: '📈',
    category: 'visualization',
    module: 'pos',
    configSchema: {},
    defaultConfig: {},
    component: 'POSChartCard'
  },
  {
    id: 'pos-table',
    name: 'POS Table',
    description: 'Tabular view of POS data',
    icon: '📋',
    category: 'visualization',
    module: 'pos',
    configSchema: {},
    defaultConfig: {},
    component: 'POSTableCard'
  },
  
  // Global Cards
  {
    id: 'global-summary',
    name: 'Global Summary',
    description: 'Overview of all business modules',
    icon: '🌐',
    category: 'analytics',
    module: 'global',
    configSchema: {},
    defaultConfig: {},
    component: 'GlobalSummaryCard'
  },
  {
    id: 'global-chart',
    name: 'Global Chart',
    description: 'Cross-module data visualization',
    icon: '📊',
    category: 'visualization',
    module: 'global',
    configSchema: {},
    defaultConfig: {},
    component: 'GlobalChartCard'
  }
];

// ========== DASHBOARD CONTEXT ==========

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<DashboardSettings>(DEFAULT_DASHBOARD_SETTINGS);
  const [activeLayout, setActiveLayout] = useState<DashboardLayout | null>(null);
  const [filters, setFilters] = useState<DashboardFilterState>({});

  const { state: companyState } = useCompany();
  const { state: settingsState } = useSettings();
  
  // Call useAnalytics unconditionally at top level (React hooks rule)
  // The hook itself handles the case when provider is not available
  const analytics = useAnalytics();
  // const stock = useStock(); // TODO: Use when implementing functions
  // const hr = useHR(); // TODO: Use when implementing functions
  // const bookings = useBookings(); // TODO: Use when implementing functions
  // const finance = useFinance(); // TODO: Use when implementing functions
  // const pos = usePOS(); // TODO: Use when implementing functions

  // ========== LAYOUT MANAGEMENT ==========

  const createLayout = useCallback(async (layout: Omit<DashboardLayout, 'id' | 'createdAt' | 'updatedAt'>): Promise<DashboardLayout> => {
    try {
      setLoading(true);
      setError(null);

      const newLayout: DashboardLayout = {
        ...layout,
        id: `layout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const updatedSettings = {
        ...settings,
        layouts: [...settings.layouts, newLayout],
        lastUpdated: Date.now(),
      };

      setSettings(updatedSettings);
      
      // Save to settings context
      // TODO: Implement updateUserSettings in SettingsContext
      console.log("Update user settings:", { dashboardSettings: updatedSettings });

      return newLayout;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating layout');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [settings, settingsState]);

  const updateLayout = useCallback(async (layoutId: string, updates: Partial<DashboardLayout>): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const updatedLayouts = settings.layouts.map(layout =>
        layout.id === layoutId
          ? { ...layout, ...updates, updatedAt: Date.now() }
          : layout
      );

      const updatedSettings = {
        ...settings,
        layouts: updatedLayouts,
        lastUpdated: Date.now(),
      };

      setSettings(updatedSettings);
      
      // Save to settings context
      // TODO: Implement updateUserSettings in SettingsContext
      console.log("Update user settings:", { dashboardSettings: updatedSettings });

      if (activeLayout?.id === layoutId) {
        setActiveLayout({ ...activeLayout, ...updates, updatedAt: Date.now() });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating layout');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [settings, activeLayout, settingsState]);

  const deleteLayout = useCallback(async (layoutId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const updatedLayouts = settings.layouts.filter(layout => layout.id !== layoutId);
      
      const updatedSettings = {
        ...settings,
        layouts: updatedLayouts,
        lastUpdated: Date.now(),
      };

      setSettings(updatedSettings);
      
      // Save to settings context
      // TODO: Implement updateUserSettings in SettingsContext
      console.log("Update user settings:", { dashboardSettings: updatedSettings });

      if (activeLayout?.id === layoutId) {
        setActiveLayout(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting layout');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [settings, activeLayout, settingsState]);

  const setActiveLayoutById = useCallback(async (layoutId: string): Promise<void> => {
    try {
      const layout = settings.layouts.find(l => l.id === layoutId);
      if (layout) {
        setActiveLayout(layout);
        
        const updatedSettings = {
          ...settings,
          activeLayout: layoutId,
          lastUpdated: Date.now(),
        };

        setSettings(updatedSettings);
        
        // Save to settings context
        // TODO: Implement updateUserSettings in SettingsContext
        console.log("Update user settings:", { dashboardSettings: updatedSettings });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error setting active layout');
      throw err;
    }
  }, [settings, settingsState]);

  const duplicateLayout = useCallback(async (layoutId: string, newName: string): Promise<DashboardLayout> => {
    try {
      const originalLayout = settings.layouts.find(l => l.id === layoutId);
      if (!originalLayout) {
        throw new Error('Layout not found');
      }

      const duplicatedLayout: DashboardLayout = {
        ...originalLayout,
        id: `layout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: newName,
        isDefault: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        cards: originalLayout.cards.map(card => ({
          ...card,
          id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        })),
      };

      const updatedSettings = {
        ...settings,
        layouts: [...settings.layouts, duplicatedLayout],
        lastUpdated: Date.now(),
      };

      setSettings(updatedSettings);
      
      // Save to settings context
      // TODO: Implement updateUserSettings in SettingsContext
      console.log("Update user settings:", { dashboardSettings: updatedSettings });

      return duplicatedLayout;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error duplicating layout');
      throw err;
    }
  }, [settings, settingsState]);

  // ========== CARD MANAGEMENT ==========

  const addCard = useCallback(async (card: Omit<DashboardCard, 'id' | 'lastUpdated'>): Promise<DashboardCard> => {
    try {
      setLoading(true);
      setError(null);

      const newCard: DashboardCard = {
        ...card,
        id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        lastUpdated: Date.now(),
      };

      if (activeLayout) {
        const updatedLayout = {
          ...activeLayout,
          cards: [...activeLayout.cards, newCard],
          updatedAt: Date.now(),
        };

        await updateLayout(activeLayout.id, updatedLayout);
      }

      return newCard;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding card');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [activeLayout, updateLayout]);

  const updateCard = useCallback(async (cardId: string, updates: Partial<DashboardCard>): Promise<void> => {
    try {
      if (!activeLayout) return;

      const updatedCards = activeLayout.cards.map(card =>
        card.id === cardId
          ? { ...card, ...updates, lastUpdated: Date.now() }
          : card
      );

      await updateLayout(activeLayout.id, { cards: updatedCards });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating card');
      throw err;
    }
  }, [activeLayout, updateLayout]);

  const removeCard = useCallback(async (cardId: string): Promise<void> => {
    try {
      if (!activeLayout) return;

      const updatedCards = activeLayout.cards.filter(card => card.id !== cardId);
      await updateLayout(activeLayout.id, { cards: updatedCards });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error removing card');
      throw err;
    }
  }, [activeLayout, updateLayout]);

  const moveCard = useCallback(async (cardId: string, newPosition: { x: number; y: number }): Promise<void> => {
    try {
      const currentCard = activeLayout?.cards.find(c => c.id === cardId);
      if (currentCard?.position) {
        await updateCard(cardId, { position: { ...currentCard.position, ...newPosition } });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error moving card');
      throw err;
    }
  }, [updateCard, activeLayout]);

  const resizeCard = useCallback(async (cardId: string, newSize: { w: number; h: number }): Promise<void> => {
    try {
      const currentCard = activeLayout?.cards.find(c => c.id === cardId);
      if (currentCard?.position) {
        await updateCard(cardId, { position: { ...currentCard.position, ...newSize } });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error resizing card');
      throw err;
    }
  }, [updateCard, activeLayout]);

  const duplicateCard = useCallback(async (cardId: string): Promise<DashboardCard> => {
    try {
      const originalCard = activeLayout?.cards.find(c => c.id === cardId);
      if (!originalCard) {
        throw new Error('Card not found');
      }

      const duplicatedCard: DashboardCard = {
        ...originalCard,
        id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: `${originalCard.title} (Copy)`,
        lastUpdated: Date.now(),
      };

      await addCard(duplicatedCard);
      return duplicatedCard;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error duplicating card');
      throw err;
    }
  }, [activeLayout, addCard]);

  // ========== DATA MANAGEMENT ==========

  const getCardData = useCallback(async (card: DashboardCard): Promise<any> => {
    try {
      const { source, module, config } = card.data;
      
      switch (source) {
        case 'kpi':
          if (!analytics) {
            console.warn('Analytics not available for KPI generation');
            return [];
          }
          
          switch (module) {
            case 'stock':
              return await analytics.getStockKPIs();
            case 'hr':
              return await analytics.getHRKPIs();
            case 'bookings':
              return await analytics.getBookingsKPIs();
            case 'finance':
              return await analytics.getFinanceKPIs();
            case 'pos':
              return await analytics.getPOSKPIs();
            default:
              return [];
          }
          
        case 'chart':
          if (!analytics) {
            console.warn('Analytics not available for chart data generation');
            return { labels: [], datasets: [] };
          }
          
          switch (module) {
            case 'stock':
              return await analytics.getStockChartData(card.groupBy || { field: 'category', type: 'category' }, config.valueField);
            case 'hr':
              return await analytics.getHRChartData(card.groupBy || { field: 'department', type: 'custom' }, config.valueField);
            case 'bookings':
              return await analytics.getBookingsChartData(card.groupBy || { field: 'status', type: 'custom' }, config.valueField);
            case 'finance':
              return await analytics.getFinanceChartData(card.groupBy || { field: 'type', type: 'custom' }, config.valueField);
            case 'pos':
              return await analytics.getPOSChartData(card.groupBy || { field: 'paymentMethod', type: 'custom' }, config.valueField);
            default:
              return { labels: [], datasets: [] };
          }
          
        case 'table':
          if (!analytics) {
            console.warn('Analytics not available for table data generation');
            return { data: [], summary: { total: 0, average: 0, min: 0, max: 0, count: 0 } };
          }
          
          switch (module) {
            case 'stock':
              return await analytics.getStockAnalytics(card.groupBy, card.filters);
            case 'hr':
              return await analytics.getHRAnalytics(card.groupBy, card.filters);
            case 'bookings':
              return await analytics.getBookingsAnalytics(card.groupBy, card.filters);
            case 'finance':
              return await analytics.getFinanceAnalytics(card.groupBy, card.filters);
            case 'pos':
              return await analytics.getPOSAnalytics(card.groupBy, card.filters);
            default:
              return { data: [], summary: { total: 0, average: 0, min: 0, max: 0, count: 0 } };
          }
          
        default:
          return null;
      }
    } catch (err) {
      console.error('Error getting card data:', err);
      return null;
    }
  }, [analytics]);

  const refreshCardData = useCallback(async (cardId: string): Promise<void> => {
    try {
      const card = activeLayout?.cards.find(c => c.id === cardId);
      if (card) {
        // const data = await getCardData(card); // TODO: Use data when implementing refresh
        await updateCard(cardId, { lastUpdated: Date.now() });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error refreshing card data');
      throw err;
    }
  }, [activeLayout, getCardData, updateCard]);

  const refreshAllCards = useCallback(async (): Promise<void> => {
    try {
      if (!activeLayout) return;

      const refreshPromises = activeLayout.cards.map(card => refreshCardData(card.id));
      await Promise.all(refreshPromises);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error refreshing all cards');
      throw err;
    }
  }, [activeLayout, refreshCardData]);

  // ========== FILTER MANAGEMENT ==========

  const setFilter = useCallback(async (filterId: string, value: any): Promise<void> => {
    try {
      setFilters(prev => ({ ...prev, [filterId]: value }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error setting filter');
      throw err;
    }
  }, []);

  const clearFilters = useCallback(async (): Promise<void> => {
    try {
      setFilters({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error clearing filters');
      throw err;
    }
  }, []);

  const applyFilters = useCallback(async (): Promise<void> => {
    try {
      await refreshAllCards();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error applying filters');
      throw err;
    }
  }, [refreshAllCards]);

  // ========== REPORT MANAGEMENT ==========

  const generateReport = useCallback(async (templateId: string, filters?: FilterOptions, groupBy?: GroupByOptions): Promise<ReportGeneration> => {
    try {
      setLoading(true);
      setError(null);

      // This would integrate with a report generation service
      const reportGeneration: ReportGeneration = {
        id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        templateId,
        status: 'generating',
        progress: 0,
        startedAt: Date.now(),
        generatedBy: companyState.user?.uid || '',
        filters: filters || {},
        groupBy,
      };

      // Simulate report generation
      setTimeout(() => {
        reportGeneration.status = 'completed';
        reportGeneration.progress = 100;
        reportGeneration.completedAt = Date.now();
        reportGeneration.fileUrl = `https://example.com/reports/${reportGeneration.id}.pdf`;
      }, 5000);

      return reportGeneration;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generating report');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [companyState.user?.uid]);

  const getReportTemplates = useCallback(async (_module?: string): Promise<ReportTemplate[]> => {
    try {
      // This would fetch from a report templates service
      return [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error getting report templates');
      throw err;
    }
  }, []);

  const createReportTemplate = useCallback(async (template: Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReportTemplate> => {
    try {
      const newTemplate: ReportTemplate = {
        ...template,
        id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      return newTemplate;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating report template');
      throw err;
    }
  }, []);

  const updateReportTemplate = useCallback(async (_templateId: string, _updates: Partial<ReportTemplate>): Promise<void> => {
    try {
      // This would update the report template
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating report template');
      throw err;
    }
  }, []);

  const deleteReportTemplate = useCallback(async (_templateId: string): Promise<void> => {
    try {
      // This would delete the report template
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting report template');
      throw err;
    }
  }, []);

  // ========== SETTINGS MANAGEMENT ==========

  const updateSettings = useCallback(async (updates: Partial<DashboardSettings>): Promise<void> => {
    try {
      const updatedSettings = { ...settings, ...updates, lastUpdated: Date.now() };
      setSettings(updatedSettings);
      
      // Save to settings context
      // TODO: Implement updateUserSettings in SettingsContext
      console.log("Update user settings:", { dashboardSettings: updatedSettings });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating settings');
      throw err;
    }
  }, [settings, settingsState]);

  const resetToDefaults = useCallback(async (): Promise<void> => {
    try {
      setSettings(DEFAULT_DASHBOARD_SETTINGS);
      setActiveLayout(null);
      setFilters({});
      
      // Save to settings context
      // TODO: Implement updateUserSettings in SettingsContext
      console.log("Update user settings:", { dashboardSettings: DEFAULT_DASHBOARD_SETTINGS });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error resetting to defaults');
      throw err;
    }
  }, [settingsState]);

  // ========== UTILITY FUNCTIONS ==========

  const getAvailableCardTypes = useCallback((module?: string): DashboardCardType[] => {
    if (module) {
      return DASHBOARD_CARD_TYPES.filter(cardType => 
        cardType.module === module || cardType.module === 'global'
      );
    }
    return DASHBOARD_CARD_TYPES;
  }, []);

  const getDefaultLayout = useCallback((module: string): DashboardLayout => {
    const defaultCards: DashboardCard[] = [
      {
        id: `default-kpi-${module}`,
        title: `${module.toUpperCase()} KPIs`,
        type: 'kpi',
        size: 'medium',
        position: { x: 0, y: 0, w: 4, h: 3 },
        data: { source: 'kpi', module: module as any, config: {} },
        filters: {},
        visible: true,
        order: 0,
        lastUpdated: Date.now(),
      },
      {
        id: `default-chart-${module}`,
        title: `${module.toUpperCase()} Chart`,
        type: 'chart',
        size: 'large',
        position: { x: 4, y: 0, w: 6, h: 4 },
        data: { source: 'chart', module: module as any, config: {} },
        filters: {},
        visible: true,
        order: 1,
        lastUpdated: Date.now(),
      },
      {
        id: `default-table-${module}`,
        title: `${module.toUpperCase()} Table`,
        type: 'table',
        size: 'xlarge',
        position: { x: 0, y: 4, w: 8, h: 6 },
        data: { source: 'table', module: module as any, config: {} },
        filters: {},
        visible: true,
        order: 2,
        lastUpdated: Date.now(),
      },
    ];

    return {
      id: `default-${module}`,
      name: `Default ${module.toUpperCase()} Layout`,
      description: `Default layout for ${module} dashboard`,
      isDefault: true,
      isGlobal: false,
      module: module as any,
      cards: defaultCards,
      gridSize: { columns: 12, rows: 10 },
      breakpoints: { xs: 12, sm: 6, md: 4, lg: 3, xl: 2 },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: companyState.user?.uid || '',
    };
  }, [companyState.user?.uid]);

  const exportLayout = useCallback(async (layoutId: string): Promise<string> => {
    try {
      const layout = settings.layouts.find(l => l.id === layoutId);
      if (!layout) {
        throw new Error('Layout not found');
      }
      return JSON.stringify(layout, null, 2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error exporting layout');
      throw err;
    }
  }, [settings]);

  const importLayout = useCallback(async (layoutData: string): Promise<DashboardLayout> => {
    try {
      const layout = JSON.parse(layoutData) as DashboardLayout;
      layout.id = `layout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      layout.createdAt = Date.now();
      layout.updatedAt = Date.now();
      layout.isDefault = false;
      
      await createLayout(layout);
      return layout;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error importing layout');
      throw err;
    }
  }, [createLayout]);

  // ========== INITIALIZATION ==========

  useEffect(() => {
    // Load dashboard settings from user settings
    // TODO: Implement dashboardSettings in SettingsContext
    if ((settingsState.settings as any)?.dashboardSettings) {
      setSettings((settingsState.settings as any).dashboardSettings);
      
      // Set active layout if available
      if ((settingsState.settings as any).dashboardSettings.activeLayout) {
        const layout = (settingsState.settings as any).dashboardSettings.layouts.find(
          (l: any) => l.id === (settingsState.settings as any).dashboardSettings.activeLayout
        );
        if (layout) {
          setActiveLayout(layout);
        }
      }
    }
  }, [settingsState.settings]);

  const value: DashboardContextType = {
    loading,
    error,
    settings,
    activeLayout,
    filters,
    createLayout,
    updateLayout,
    deleteLayout,
    setActiveLayout: setActiveLayoutById,
    duplicateLayout,
    addCard,
    updateCard,
    removeCard,
    moveCard,
    resizeCard,
    duplicateCard,
    refreshCardData,
    refreshAllCards,
    getCardData,
    setFilter,
    clearFilters,
    applyFilters,
    generateReport,
    getReportTemplates,
    createReportTemplate,
    updateReportTemplate,
    deleteReportTemplate,
    updateSettings,
    resetToDefaults,
    getAvailableCardTypes,
    getDefaultLayout,
    exportLayout,
    importLayout,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

export { DashboardContext };
