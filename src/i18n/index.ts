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
      common: {
        viewAll: 'Показать все'
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
      },
      landing: {
        badge: 'Автоматизация документов на базе ИИ',
        title: 'Умные процессы для',
        accent: 'вашего бизнеса',
        sub: 'Dockflow автоматизирует согласования документов, маршрутизацию и управление — чтобы ваша команда занималась делом, а не бумагами.',
        startFree: 'Начать бесплатно →',
        howItWorks: 'Как это работает',
        stats: {
          faster: 'Быстрее согласования',
          lessManual: 'Меньше ручной работы',
          audit: 'Прозрачный аудит',
          support: 'Поддержка в Казахстане'
        },
        mockup: {
          documents: 'Документы',
          workflows: 'Процессы',
          company: 'Компания',
          reports: 'Отчёты',
          upload: '+ Загрузить',
          total: 'Всего',
          pending: 'На согласовании',
          approved: 'Утверждено',
          thisWeek: 'за неделю',
          awaiting: 'ожидают',
          type: 'Тип',
          date: 'Дата',
          status: 'Статус',
          statuses: {
            approved: 'Утверждён',
            review: 'На проверке',
            pending: 'Ожидает'
          }
        },
        features: {
          label: 'Возможности',
          title: 'Всё для автоматизации документооборота',
          sub: 'Dockflow объединяет управление документами, автоматизацию процессов и ИИ в одной платформе.',
          items: [
            { title: 'Управление документами', desc: 'Загружайте, версионируйте и организуйте все бизнес-документы в одном защищённом месте с контролем целостности SHA-256.' },
            { title: 'Маршруты согласования', desc: 'Создавайте многоэтапные маршруты согласования с условиями, ролями и дедлайнами. Без кода — просто настройте.' },
            { title: 'ИИ-ассистент', desc: 'Суммаризируйте документы, извлекайте ключевые данные и получайте умные подсказки — на базе Groq и Gemini.' },
            { title: 'Безопасность и аудит', desc: 'Полный журнал аудита по каждому действию. Ролевой контроль доступа с мультитенантностью для изоляции данных.' },
            { title: 'Совместное редактирование', desc: 'Редактируйте документы вместе в реальном времени через OnlyOffice — не покидая платформу.' },
            { title: 'Аналитика и отчёты', desc: 'Отслеживайте сроки обработки, узкие места и эффективность команды через дашборды с экспортом.' }
          ]
        },
        pricing: {
          label: 'Тарифы',
          title: 'Простые и прозрачные тарифы',
          sub: 'Начните бесплатно, масштабируйтесь по мере роста. Все планы включают базовое управление документами.',
          starter: 'Стартер',
          business: 'Бизнес',
          enterprise: 'Корпоративный',
          foreverFree: 'Навсегда бесплатно',
          perMonth: 'в месяц · до 20 пользователей',
          custom: 'По запросу',
          tailored: 'Под ваши задачи',
          mostPopular: 'Популярный',
          features: {
            users3: 'До 3 пользователей',
            docs50: '50 документов / месяц',
            basicWorkflows: 'Базовые маршруты',
            aiFeatures: 'ИИ-функции',
            prioritySupport: 'Приоритетная поддержка',
            unlimitedDocs: 'Неограниченные документы',
            advancedWorkflows: 'Продвинутые маршруты',
            aiAdvanced: 'ИИ-суммаризация и извлечение данных',
            auditTrail: 'Полный журнал аудита',
            unlimitedUsers: 'Неограниченные пользователи',
            onPremise: 'Возможность on-premise',
            customIntegrations: 'Кастомные интеграции',
            sla: 'Гарантия SLA',
            dedicatedManager: 'Персональный менеджер'
          },
          getStartedFree: 'Начать бесплатно',
          startTrial: 'Попробовать 14 дней',
          contactUs: 'Связаться с нами'
        },
        faq: {
          label: 'FAQ',
          title: 'Частые вопросы',
          items: [
            { q: 'Подходит ли Dockflow для небольших компаний?', a: 'Да. Dockflow создан для МСБ в Казахстане. Стартовый тариф полностью бесплатен и масштабируется по мере роста команды.' },
            { q: 'Чем Dockflow отличается от ELMA365 или 1С?', a: 'Dockflow дешевле, быстрее внедряется и включает ИИ «из коробки». Никаких дорогостоящих проектов внедрения.' },
            { q: 'Где хранятся мои данные?', a: 'Данные хранятся на серверах Hetzner с регулярными бэкапами. Корпоративные клиенты могут выбрать on-premise в Казахстане.' },
            { q: 'Можно ли перейти с другой системы?', a: 'Да. Мы помогаем с миграцией и поддерживаем массовый импорт документов и метаданных из распространённых форматов.' },
            { q: 'Есть ли мобильное приложение?', a: 'Мобильное приложение для Android и iOS в разработке. Веб-приложение уже адаптировано и отлично работает на телефоне.' },
            { q: 'Как работает пробный период 14 дней?', a: 'Карта не нужна. Просто зарегистрируйтесь — 14 дней полного доступа к плану Бизнес. В любой момент перейдите на бесплатный.' }
          ]
        },
        cta: {
          label: 'Готовы начать?',
          title: 'Автоматизируйте документы уже сегодня',
          sub: 'Присоединяйтесь к компаниям Казахстана, которые уже работают умнее с Dockflow.',
          demo: 'Запросить демо'
        },
        footer: {
          madeInKz: 'Сделано в Казахстане',
          privacy: 'Политика',
          terms: 'Условия'
        }
      },
      auth: {
        signIn: 'Войти',
        signUp: 'Регистрация',
        email: 'Электронная почта',
        password: 'Пароль',
        confirmPassword: 'Подтвердите пароль',
        firstName: 'Имя',
        lastName: 'Фамилия',
        forgotPassword: 'Забыли пароль?',
        noAccount: 'Нет аккаунта? Зарегистрируйтесь',
        hasAccount: 'Уже есть аккаунт? Войдите',
        createAccount: 'Создать аккаунт',
        signingIn: 'Вход...',
        creatingAccount: 'Создание аккаунта...',
        loginTitle: 'Войдите в DocFlow',
        loginSub: 'Интеллектуальная автоматизация документооборота',
        registerTitle: 'Создайте аккаунт',
        registerSub: 'Присоединяйтесь к DocFlow и начните автоматизировать свои рабочие процессы',
        backToHome: 'Назад на главную',
        passwordsDoNotMatch: 'Пароли не совпадают',
        passwordTooShort: 'Пароль должен быть не менее 6 символов',
        acceptInviteTitle: 'Принять приглашение',
        acceptInviteSub: 'Создайте пароль для вашего ключа подписи, чтобы присоединиться к компании',
        keyPasswordLabel: 'Пароль для .p12 ключа',
        acceptAndDownload: 'Принять и скачать ключ',
        successJoined: 'Вы успешно присоединились!',
        keepKeySafe: 'Сохраните файл .p12 в надежном месте. Он понадобится вам для подписи документов.'
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
      common: {
        viewAll: 'Барлығын көру'
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
      },
      landing: {
        badge: 'ЖИ-мен басқарылатын құжат айналымы',
        title: 'Бизнесіңіз үшін',
        accent: 'зияткерлік жұмыс процестері',
        sub: 'Dockflow құжаттарды келісу, бағыттау және басқару процестерін автоматтандырады — осылайша сіздің командаңыз қағазбастылыққа емес, маңызды істерге назар аударады.',
        startFree: 'Тегін сынақ мерзімін бастау →',
        howItWorks: 'Жұмыс принципін көру',
        stats: {
          faster: 'Жылдамырақ келісу',
          lessManual: 'Аз қол еңбегі',
          audit: 'Аудит тарихы',
          support: 'Жергілікті қолдау'
        },
        mockup: {
          documents: 'Құжаттар',
          workflows: 'Жұмыс процестері',
          company: 'Компания',
          reports: 'Есептер',
          upload: '+ Жүктеу',
          total: 'Барлығы',
          pending: 'Келісуде',
          approved: 'Бекітілген',
          thisWeek: 'осы аптада',
          awaiting: 'күтудегілер',
          type: 'Түрі',
          date: 'Күні',
          status: 'Статусы',
          statuses: {
            approved: 'Бекітілді',
            review: 'Қаралуда',
            pending: 'Күтуде'
          }
        },
        features: {
          label: 'Мүмкіндіктер',
          title: 'Құжаттарды автоматтандыруға қажеттінің бәрі',
          sub: 'Dockflow — құжаттарды басқаруды, жұмыс процестерін автоматтандыруды және ЖИ-ді бір платформаға біріктіреді.',
          items: [
            { title: 'Құжаттарды басқару', desc: 'Барлық бизнес құжаттарды SHA-256 тұтастығын тексеру арқылы бір қауіпсіз жерде жүктеңіз, нұсқалаңыз және реттеңіз.' },
            { title: 'Келісу маршруттары', desc: 'Ережелері, рөлдері және мерзімдері бар көп сатылы келісу маршруттарын жасаңыз. Кодсыз — жай ғана теңшеңіз.' },
            { title: 'ЖИ ассистенті', desc: 'Құжаттарды қорытындылаңыз, негізгі деректерді шығарыңыз және ақылды кеңестер алыңыз — Groq және Gemini негізінде.' },
            { title: 'Қауіпсіздік және аудит', desc: 'Әрбір әрекет бойынша толық аудит журналы. Деректерді оқшаулау үшін рөлге негізделген қол жеткізуді басқару.' },
            { title: 'Бірлесіп өңдеу', desc: 'OnlyOffice интеграциясы арқылы құжаттарды нақты уақыт режимінде бірге өңдеңіз — платформадан шықпай-ақ.' },
            { title: 'Аналитика және есептер', desc: 'Нақты уақыттағы бақылау тақталары мен экспорттау опциялары арқылы өңдеу уақытын, кедергілерді және команда жұмысын қадағалаңыз.' }
          ]
        },
        pricing: {
          label: 'Тарифтер',
          title: 'Қарапайым әрі ашық бағалар',
          sub: 'Төменнен бастап, командаңыз өскен сайын кеңейтіңіз. Барлық тарифтерде құжаттарды басқарудың негізгі функциялары бар.',
          starter: 'Стартер',
          business: 'Бизнес',
          enterprise: 'Корпоративтік',
          foreverFree: 'Мәңгілікке тегін',
          perMonth: 'айына · 20 пайдаланушыға дейін',
          custom: 'Сұраныс бойынша',
          tailored: 'Сіздің мақсаттарыңыз үшін',
          mostPopular: 'Танымал',
          features: {
            users3: '3 пайдаланушыға дейін',
            docs50: '50 құжат / айына',
            basicWorkflows: 'Негізгі жұмыс процестері',
            aiFeatures: 'ЖИ мүмкіндіктері',
            prioritySupport: 'Басым қолдау',
            unlimitedDocs: 'Шексіз құжаттар',
            advancedWorkflows: 'Кеңейтілген маршруттар',
            aiAdvanced: 'ЖИ-мен қорытындылау және деректерді алу',
            auditTrail: 'Толық аудит журналы',
            unlimitedUsers: 'Шексіз пайдаланушылар',
            onPremise: 'On-premise мүмкіндігі',
            customIntegrations: 'Арнайы интеграциялар',
            sla: 'SLA кепілдігі',
            dedicatedManager: 'Жеке менеджер'
          },
          getStartedFree: 'Тегін бастау',
          startTrial: '14 күндік сынақ',
          contactUs: 'Бізбен байланысыңыз'
        },
        faq: {
          label: 'FAQ',
          title: 'Жиі қойылатын сұрақтар',
          items: [
            { q: 'Dockflow шағын компаниялар үшін қолайлы ма?', a: 'Иә. Dockflow Қазақстандағы ШОБ (Шағын және орта бизнес) үшін арнайы әзірленген. Стартер тарифі толығымен тегін және командаңыз өскен сайын кеңейеді.' },
            { q: 'Dockflow-тың ELMA365 немесе 1С-тен айырмашылығы неде?', a: 'Dockflow қолжетімдірек, жылдам енгізіледі және ЖИ мүмкіндіктерін бірден ұсынады. Қымбат енгізу жобаларын қажет етпейді.' },
            { q: 'Менің деректерім қайда сақталады?', a: 'Деректер Hetzner серверлерінде тұрақты сақтық көшірмелермен сақталады. Корпоративтік клиенттер Қазақстанда on-premise таңдай алады.' },
            { q: 'Басқа жүйеден көшуге бола ма?', a: 'Иә. Біз көшуге көмектесеміз және кең таралған форматтардан құжаттар мен метадеректерді жаппай импорттауды қолдаймыз.' },
            { q: 'Мобильді қосымша бар ма?', a: 'Android және iOS жүйелеріне арналған мобильді қосымша әзірлену үстінде. Веб-қосымша бейімделген және қазір телефонда жақсы жұмыс істейді.' },
            { q: '14 күндік сынақ мерзімі қалай жұмыс істейді?', a: 'Карта қажет емес. Тіркеліңіз — Бизнес жоспарына 14 күндік толық қолжетімділік. Кез келген уақытта тегін нұсқаға өтіңіз.' }
          ]
        },
        cta: {
          label: 'Бастауға дайынсыз ба?',
          title: 'Құжат айналымын бүгіннен бастап автоматтандырыңыз',
          sub: 'Dockflow-ты таңдаған Қазақстанның озық компанияларының қатарына қосылыңыз.',
          demo: 'Демо сұрау'
        },
        footer: {
          madeInKz: 'Қазақстанда жасалған',
          privacy: 'Құпиялылық',
          terms: 'Пайдалану шарттары'
        }
      },
      auth: {
        signIn: 'Кіру',
        signUp: 'Тіркелу',
        email: 'Электрондық пошта',
        password: 'Құпия сөз',
        confirmPassword: 'Құпия сөзді растау',
        firstName: 'Есім',
        lastName: 'Тегі',
        forgotPassword: 'Құпия сөзді ұмыттыңыз ба?',
        noAccount: 'Аккаунт жоқ па? Тіркеліңіз',
        hasAccount: 'Аккаунт бар ма? Кіріңіз',
        createAccount: 'Аккаунт ашу',
        signingIn: 'Кіру...',
        creatingAccount: 'Аккаунт жасалуда...',
        loginTitle: 'DocFlow-қа кіру',
        loginSub: 'Құжат айналымын зияткерлік автоматтандыру',
        registerTitle: 'Аккаунт жасау',
        registerSub: 'DocFlow-қа қосылыңыз және жұмыс процестеріңізді автоматтандыруды бастаңыз',
        backToHome: 'Басты бетке оралу',
        passwordsDoNotMatch: 'Құпия сөздер сәйкес келмейді',
        passwordTooShort: 'Құпия сөз кемінде 6 таңбадан тұруы керек',
        acceptInviteTitle: 'Шақыруды қабылдау',
        acceptInviteSub: 'Компанияға қосылу үшін қолтаңба кілтіне құпия сөз жасаңыз',
        keyPasswordLabel: '.p12 кілтінің құпия сөзі',
        acceptAndDownload: 'Қабылдау және кілтті жүктеу',
        successJoined: 'Сәтті қосылдыңыз!',
        keepKeySafe: '.p12 файлын қауіпсіз жерде сақтаңыз. Ол құжаттарға қол қою үшін қажет болады.'
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
      common: {
        viewAll: 'View All'
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
      },
      landing: {
        badge: 'AI-powered document automation',
        title: 'Smart workflows for',
        accent: 'your business',
        sub: 'Dockflow automates document approvals, routing, and management — so your team focuses on what matters, not on paperwork.',
        startFree: 'Start free trial →',
        howItWorks: 'See how it works',
        stats: {
          faster: 'Faster approvals',
          lessManual: 'Less manual work',
          audit: 'Audit trail',
          support: 'Local support'
        },
        mockup: {
          documents: 'Documents',
          workflows: 'Workflows',
          company: 'Company',
          reports: 'Reports',
          upload: '+ Upload',
          total: 'Total',
          pending: 'Pending',
          approved: 'Approved',
          thisWeek: 'this week',
          awaiting: 'awaiting',
          type: 'Type',
          date: 'Date',
          status: 'Status',
          statuses: {
            approved: 'Approved',
            review: 'In review',
            pending: 'Pending'
          }
        },
        features: {
          label: 'Capabilities',
          title: 'Everything you need for document automation',
          sub: 'Dockflow brings together document management, workflow automation, and AI in one platform.',
          items: [
            { title: 'Document Management', desc: 'Upload, version, and organize all your business documents in one secure place with SHA-256 integrity verification.' },
            { title: 'Approval Workflows', desc: 'Design multi-step approval flows with conditions, roles, and deadlines. No code required — just drag and configure.' },
            { title: 'AI Assistant', desc: 'Summarize documents, extract key data, and get smart suggestions — powered by Groq and Gemini APIs.' },
            { title: 'Security & Audit', desc: 'Full audit trail on every action. Role-based access control with multi-tenancy for complete data isolation.' },
            { title: 'Collaborative Editing', desc: 'Edit documents together in real time via OnlyOffice integration — without leaving the platform.' },
            { title: 'Analytics & Reports', desc: 'Track processing times, bottlenecks, and team performance with real-time dashboards and export options.' }
          ]
        },
        pricing: {
          label: 'Pricing',
          title: 'Simple, transparent pricing',
          sub: 'Start free, scale as your team grows. All plans include core document management.',
          starter: 'Starter',
          business: 'Business',
          enterprise: 'Enterprise',
          foreverFree: 'Forever free',
          perMonth: 'per month · up to 20 users',
          custom: 'Custom',
          tailored: 'Tailored to your company',
          mostPopular: 'Most Popular',
          features: {
            users3: 'Up to 3 users',
            docs50: '50 documents / month',
            basicWorkflows: 'Basic workflows',
            aiFeatures: 'AI features',
            prioritySupport: 'Priority support',
            unlimitedDocs: 'Unlimited documents',
            advancedWorkflows: 'Advanced workflows',
            aiAdvanced: 'AI summarization & extraction',
            auditTrail: 'Full audit trail',
            unlimitedUsers: 'Unlimited users',
            onPremise: 'On-premise option',
            customIntegrations: 'Custom integrations',
            sla: 'SLA guarantee',
            dedicatedManager: 'Dedicated manager'
          },
          getStartedFree: 'Get started free',
          startTrial: 'Start 14-day trial',
          contactUs: 'Contact us'
        },
        faq: {
          label: 'FAQ',
          title: 'Common questions',
          items: [
            { q: 'Is Dockflow suitable for small companies?', a: 'Yes. Dockflow is built for SMBs in Kazakhstan. The Starter plan is completely free and scales as your team grows.' },
            { q: 'How is Dockflow different from ELMA365 or 1C?', a: 'Dockflow is more affordable, faster to set up, and includes built-in AI features. No expensive implementation project needed.' },
            { q: 'Where is my data stored?', a: 'Data is stored on Hetzner servers with regular backups. Enterprise clients can opt for on-premise deployment in Kazakhstan.' },
            { q: 'Can I migrate from another system?', a: 'Yes. We provide migration assistance and support for bulk import of documents and metadata from common formats.' },
            { q: 'Is there a mobile app?', a: 'A mobile app for Android and iOS is in development. The web app is fully responsive and works great on phones today.' },
            { q: 'How does the 14-day trial work?', a: 'No credit card needed. Just sign up and get full Business plan access for 14 days. Downgrade to free anytime.' }
          ]
        },
        cta: {
          label: 'Ready to start?',
          title: 'Automate your documents today',
          sub: 'Join companies in Kazakhstan who already work smarter with Dockflow.',
          demo: 'Request a demo'
        },
        footer: {
          madeInKz: 'Made in Kazakhstan',
          privacy: 'Privacy',
          terms: 'Terms'
        }
      },
      auth: {
        signIn: 'Sign In',
        signUp: 'Sign Up',
        email: 'Email address',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        firstName: 'First Name',
        lastName: 'Last Name',
        forgotPassword: 'Forgot your password?',
        noAccount: "Don't have an account? Sign up",
        hasAccount: 'Already have an account? Sign in',
        createAccount: 'Create account',
        signingIn: 'Signing in...',
        creatingAccount: 'Creating account...',
        loginTitle: 'Sign in to DocFlow',
        loginSub: 'Intelligent Document Workflow Automation',
        registerTitle: 'Create your account',
        registerSub: 'Join DocFlow and start automating your document workflows',
        backToHome: 'Back to Home',
        passwordsDoNotMatch: 'Passwords do not match',
        passwordTooShort: 'Password must be at least 6 characters long',
        acceptInviteTitle: 'Accept Invitation',
        acceptInviteSub: 'Create a password for your signature key to join the company',
        keyPasswordLabel: 'Password for .p12 key',
        acceptAndDownload: 'Accept & Download Key',
        successJoined: 'Successfully joined!',
        keepKeySafe: 'Keep the .p12 file in a safe place. You will need it to sign documents.'
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
    debug: import.meta.env.DEV,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

export default i18n;