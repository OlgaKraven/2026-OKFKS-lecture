import type { SourceRecord } from '../types'
import { laboratories } from './courseData'

const checkedAt = '2026-08-31'

const coreSources: SourceRecord[] = [
  {
    id: 'rpd-okfks-text', title: 'Текст РПД МДК.04.02 «Обеспечение качества функционирования компьютерных систем»', type: 'rpd',
    purpose: 'Официальные названия, содержание, часы, компетенции, лабораторные работы и самостоятельная работа',
    location: 'PROMPT.md', localCopy: 'PROMPT.md', version: 'текст, предоставленный пользователем', checkedAt, official: true,
    publication: 'Публикуются структурированные выдержки; реквизиты, отсутствующие в источнике, не добавляются.', usedIn: ['все темы и конфигурационные проверки'],
  },
  {
    id: 'okfks-materials', title: 'Папка материалов МДК.04.02', type: 'materials', purpose: 'Экран 05 и QR-код',
    location: 'https://disk.yandex.ru/d/Vz62H71Jub1GLA', localCopy: 'public/qr/okfks-materials.png', version: 'ссылка предоставлена пользователем; содержимое не просматривалось', checkedAt,
    official: false, publication: 'Ссылка и QR публикуются; наличие и состав файлов не заявляются.', usedIn: ['экран 05 всех тем'],
  },
  {
    id: 'lit-main-01', title: 'Архитектура вычислительных систем и компьютерных сетей. 2025', type: 'book', purpose: 'Основная литература',
    location: 'https://www.iprbookshop.ru/books/156708/details', version: '2025', checkedAt, official: true, publication: 'Публикуются библиографическое описание и ссылка, не полный текст.', usedIn: ['экран 03 всех тем'],
  },
  {
    id: 'lit-main-02', title: 'Юсупова С. М. Управление качеством. 2026', type: 'book', purpose: 'Основная литература',
    location: 'https://www.iprbookshop.ru/books/156513/details', version: '2026', checkedAt, official: true, publication: 'Публикуются библиографическое описание и ссылка, не полный текст.', usedIn: ['экран 03 всех тем'],
  },
  {
    id: 'lit-additional-01', title: 'Ермакова А. Н. Управление ИТ-проектами. Ч.I. 2024', type: 'book', purpose: 'Дополнительная литература',
    location: 'https://www.iprbookshop.ru/books/156620/details', version: '2024', checkedAt, official: true, publication: 'Публикуются библиографическое описание и ссылка, не полный текст.', usedIn: ['экран 04 всех тем'],
  },
  {
    id: 'lit-additional-02', title: 'Швечкова О. Г., Бабаев С. И. Информационная безопасность. Ч.1. 2024', type: 'book', purpose: 'Дополнительная литература',
    location: 'https://www.iprbookshop.ru/books/144785/details', version: '2024', checkedAt, official: true, publication: 'Публикуются библиографическое описание и ссылка, не полный текст.', usedIn: ['экран 04 всех тем'],
  },
  {
    id: 'github-pages-docs', title: 'GitHub Pages documentation', type: 'documentation', purpose: 'Публикация через GitHub Actions',
    location: 'https://docs.github.com/pages', version: 'действующая документация', checkedAt, official: true, publication: 'Ссылка и краткие технические сведения.', usedIn: ['README и workflow'],
  },
  {
    id: 'vite-static-deploy', title: 'Vite — Deploying a Static Site', type: 'documentation', purpose: 'Статическая сборка и base path',
    location: 'https://vite.dev/guide/static-deploy.html', version: 'Vite 8', checkedAt, official: true, publication: 'Ссылка и параметры сборки.', usedIn: ['vite.config.ts и workflow'],
  },
  {
    id: 'wcag-22', title: 'Web Content Accessibility Guidelines (WCAG) 2.2', type: 'documentation', purpose: 'Доступность интерфейса',
    location: 'https://www.w3.org/TR/WCAG22/', version: 'W3C Recommendation', checkedAt, official: true, publication: 'Ссылка и применённые рекомендации без заявления о сертификации.', usedIn: ['весь интерфейс и тесты'],
  },
  {
    id: 'windows-event-log-docs', title: 'Microsoft Learn — Windows Event Log', type: 'documentation', purpose: 'Журналы событий Windows 11',
    location: 'https://learn.microsoft.com/windows/win32/wes/windows-event-log', version: 'Windows 11 24H2, актуальная документация', checkedAt, official: true, publication: 'Ссылка и безопасные примеры чтения.', usedIn: ['s07-04-observing-operating-system'],
  },
  {
    id: 'microsoft-defender-docs', title: 'Microsoft Defender Antivirus documentation', type: 'documentation', purpose: 'Антивирусная защита учебного стенда',
    location: 'https://learn.microsoft.com/defender-endpoint/microsoft-defender-antivirus-windows', version: 'Windows 11 24H2, актуальная документация', checkedAt, official: true, publication: 'Ссылка и безопасные примеры чтения состояния.', usedIn: ['s08-01-threats-and-malware', 's08-02-protection-controls'],
  },
  {
    id: 'windows-firewall-docs', title: 'Microsoft Learn — Windows Firewall with Advanced Security', type: 'documentation', purpose: 'Правила сетевого экрана',
    location: 'https://learn.microsoft.com/windows/security/operating-system-security/network-security/windows-firewall/', version: 'Windows 11 24H2, актуальная документация', checkedAt, official: true, publication: 'Ссылка; изменения допускаются только в разрешённой учебной среде.', usedIn: ['s08-02-protection-controls'],
  },
  {
    id: 'bitlocker-docs', title: 'Microsoft Learn — BitLocker overview', type: 'documentation', purpose: 'Защита данных при хранении',
    location: 'https://learn.microsoft.com/windows/security/operating-system-security/data-protection/bitlocker/', version: 'Windows 11 24H2, актуальная документация', checkedAt, official: true, publication: 'Ссылка; реальные ключи восстановления не публикуются.', usedIn: ['s08-03-encryption-and-security-testing'],
  },
  {
    id: 'tls-docs', title: 'Microsoft Learn — Transport Layer Security protocol', type: 'documentation', purpose: 'Защита данных при передаче',
    location: 'https://learn.microsoft.com/windows-server/security/tls/transport-layer-security-protocol', version: 'актуальная документация', checkedAt, official: true, publication: 'Ссылка и концептуальные сведения.', usedIn: ['s08-03-encryption-and-security-testing'],
  },
  {
    id: 'owasp-wstg', title: 'OWASP Web Security Testing Guide', type: 'documentation', purpose: 'Структура проверок защиты программного обеспечения',
    location: 'https://owasp.org/www-project-web-security-testing-guide/', version: 'WSTG 4.2', checkedAt, official: true, publication: 'Ссылка и структура регламентной проверки.', usedIn: ['s08-03-encryption-and-security-testing'],
  },
  {
    id: 'synergy-logo', title: 'Фирменный логотип', type: 'brand', purpose: 'Шапки и разделители', location: 'public/brand/synergy-logo.png', localCopy: 'public/brand/synergy-logo.png',
    version: 'предоставленный фирменный ресурс', checkedAt, official: true, publication: 'Используется без искажения пропорций.', usedIn: ['каталог и все экраны'],
  },
  {
    id: 'synergy-light-arrow', title: 'Светлая фирменная стрелка', type: 'brand', purpose: 'Разделители вопросов', location: 'public/brand/divider-arrow-light.png', localCopy: 'public/brand/divider-arrow-light.png',
    version: 'предоставленный фирменный ресурс', checkedAt, official: true, publication: 'Декоративный элемент.', usedIn: ['экраны 13, 20, 27, 34, 41, 48, 55, 62'],
  },
  {
    id: 'synergy-side-pattern', title: 'Фирменный боковой орнамент', type: 'brand', purpose: 'Композиция экранов', location: 'public/brand/side-ornament.png', localCopy: 'public/brand/side-ornament.png',
    version: 'предоставленный фирменный ресурс', checkedAt, official: true, publication: 'Не перекрывает текст.', usedIn: ['все экраны'],
  },
  {
    id: 'okfks-rhino', title: 'Маскот — инженер по качеству и защите компьютерных систем', type: 'brand', purpose: 'Каталог, титульные, примеры и финал',
    location: 'public/brand/mascot/okfks-rhino.png', localCopy: 'public/brand/mascot/okfks-rhino.png', version: 'согласованный фирменный ресурс', checkedAt, official: true,
    publication: 'Один вариант используется во всём проекте.', usedIn: ['каталог, титульные, примеры и экран 85'],
  },
]

const labSources: SourceRecord[] = laboratories.map((lab) => ({
  id: `lab-${String(lab.number).padStart(2, '0')}`,
  title: `Лабораторная работа № ${lab.number}. «${lab.title}»`,
  type: 'laboratory', purpose: 'Практический блок соответствующей темы', location: 'PROMPT.md', localCopy: 'PROMPT.md', version: `${lab.hours} ч, ${lab.points} баллов`, checkedAt,
  official: true, publication: 'Публикуются название, часы, баллы и учебные указания.', usedIn: [lab.topicId],
}))

export const sourceRegistry: SourceRecord[] = [...coreSources, ...labSources]

export const getSource = (id: string) => sourceRegistry.find((source) => source.id === id)
