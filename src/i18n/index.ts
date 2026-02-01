import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Kazakhstan language resources
const resources = {
  ru: {
    translation: {
      navigation: {
        welcome: 'Добро пожаловать',
        dashboard: 'Дашборд',
        documents: 'Документы',
        workflow: 'Процессы',
        company: 'Компания',
        kanban: 'Канбан',
        chat: 'Чат',
        reports: 'Отчеты',
        aiSettings: 'AI Настройки',
        logout: 'Выйти'
      },
      documents: {
        title: 'Документы',
        upload: 'Загрузить документ',
        myDocuments: 'Мои документы',
        allDocuments: 'Все документы',
        pending: 'В ожидании',
        inReview: 'На согласовании',
        approved: 'Согласован',
        rejected: 'Отклонен',
        fileName: 'Имя файла',
        uploadDate: 'Дата загрузки',
        status: 'Статус',
        actions: 'Действия',
        view: 'Просмотр',
        edit: 'Редактировать',
        delete: 'Удалить',
        download: 'Скачать',
        sign: 'Подписать',
        aiAnalyze: 'AI Анализ'
      },
      workflow: {
        title: 'Рабочие процессы',
        templates: 'Шаблоны',
        myTasks: 'Мои задачи',
        createTemplate: 'Создать шаблон',
        workflowName: 'Название процесса',
        assignee: 'Исполнитель',
        dueDate: 'Срок',
        priority: 'Приоритет',
        approve: 'Согласовать',
        reject: 'Отклонить',
        delegate: 'Делегировать',
        comment: 'Комментарий'
      },
      // Kazakhstan specific document types
      kzDocumentTypes: {
        contract: 'Шарт',
        agreement: 'Келісім',
        act: 'Акт',
        invoice: 'Есеп-фактура',
        labor_contract: 'Еңбек шарты',
        purchase_order: 'Сатып алу тапсырысы',
        ks2: 'КС-2 акт',
        tender_document: 'Тендерлік құжат'
      }
    }
  },
  kz: {
    translation: {
      navigation: {
        welcome: 'Қош келдіңіз',
        dashboard: 'Басқару тақтасы',
        documents: 'Құжаттар',
        workflow: 'Процестер',
        company: 'Компания',
        kanban: 'Канбан',
        chat: 'Чат',
        reports: 'Есептер',
        aiSettings: 'AI Баптаулар',
        logout: 'Шығу'
      },
      documents: {
        title: 'Құжаттар',
        upload: 'Құжатты жүктеу',
        myDocuments: 'Менің құжаттарым',
        allDocuments: 'Барлық құжаттар',
        pending: 'Күтуде',
        inReview: 'Келісуде',
        approved: 'Келісілген',
        rejected: 'Қабылданбаған',
        fileName: 'Файл атауы',
        uploadDate: 'Жүктелген күні',
        status: 'Статусы',
        actions: 'Әрекеттер',
        view: 'Қарау',
        edit: 'Өңдеу',
        delete: 'Жою',
        download: 'Жүктеу',
        sign: 'Қол қою',
        aiAnalyze: 'AI талдау'
      },
      workflow: {
        title: 'Жұмыс процестері',
        templates: 'Шаблондар',
        myTasks: 'Міндеттерім',
        createTemplate: 'Шаблон жасау',
        workflowName: 'Процесс атауы',
        assignee: 'Орындаушы',
        dueDate: 'Мерзімі',
        priority: 'Басымдылығы',
        approve: 'Келісу',
        reject: 'Қабылдамау',
        delegate: 'Делегаттау',
        comment: 'Комментарий'
      },
      // Kazakhstan specific document types
      kzDocumentTypes: {
        contract: 'Шарт',
        agreement: 'Келісім',
        act: 'Акт',
        invoice: 'Есеп-фактура',
        labor_contract: 'Еңбек шарты',
        purchase_order: 'Сатып алу тапсырысы',
        ks2: 'КС-2 акт',
        tender_document: 'Тендерлік құжат'
      }
    }
  },
  en: {
    translation: {
      navigation: {
        welcome: 'Welcome',
        dashboard: 'Dashboard',
        documents: 'Documents',
        workflow: 'Workflow',
        company: 'Company',
        kanban: 'Kanban',
        chat: 'Chat',
        reports: 'Reports',
        aiSettings: 'AI Settings',
        logout: 'Logout'
      },
      documents: {
        title: 'Documents',
        upload: 'Upload Document',
        myDocuments: 'My Documents',
        allDocuments: 'All Documents',
        pending: 'Pending',
        inReview: 'In Review',
        approved: 'Approved',
        rejected: 'Rejected',
        fileName: 'File Name',
        uploadDate: 'Upload Date',
        status: 'Status',
        actions: 'Actions',
        view: 'View',
        edit: 'Edit',
        delete: 'Delete',
        download: 'Download',
        sign: 'Sign',
        aiAnalyze: 'AI Analyze'
      },
      workflow: {
        title: 'Workflow Processes',
        templates: 'Templates',
        myTasks: 'My Tasks',
        createTemplate: 'Create Template',
        workflowName: 'Process Name',
        assignee: 'Assignee',
        dueDate: 'Due Date',
        priority: 'Priority',
        approve: 'Approve',
        reject: 'Reject',
        delegate: 'Delegate',
        comment: 'Comment'
      },
      // Kazakhstan specific document types
      kzDocumentTypes: {
        contract: 'Contract',
        agreement: 'Agreement',
        act: 'Act',
        invoice: 'Invoice',
        labor_contract: 'Labor Contract',
        purchase_order: 'Purchase Order',
        ks2: 'KS-2 Act',
        tender_document: 'Tender Document'
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ru', // Default to Russian for Kazakhstan
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

export default i18n;