# МДК.04.02 «Обеспечение качества функционирования компьютерных систем»

Адаптивный сайт-презентация для 7-го и 8-го семестров. Курс содержит 7 тем, по 85 экранов в каждой: 80 учебных и 5 служебных.

## Состав курса

| Семестр | Темы | Лекции | Лабораторные | Самостоятельная работа | Всего |
|---|---:|---:|---:|---:|---:|
| 7-й | 4 | 20 ч | 20 ч | 12 ч | 52 ч |
| 8-й | 3 | 12 ч | 24 ч | 16 ч | 52 ч |
| Итого | 7 | 32 ч | 44 ч | 28 ч | 104 ч |

Промежуточная аттестация: зачёт с оценкой. Коды компетенций сохранены без расшифровок: ОК 01, ПК 4.3, ПК 4.4.

## Возможности

- каталог тем, поиск и фильтр по семестру;
- прямые ссылки `?topic=s07-02-reliability-metrics&slide=25`;
- клавиатура, кнопки навигации, прогресс, полноэкранный режим;
- светлая и тёмная темы, управление анимацией;
- профиль преподавателя в `localStorage` по ключу `okfks.teacherProfile`;
- сохранение прогресса и ответов, окно результатов и сброс;
- teacher-печать из интерфейса и student/teacher PDF через CLI;
- программно созданный и декодированный QR-код материалов;
- адаптивная компоновка и поддержка `prefers-reduced-motion`.

В интерфейсе намеренно нет кнопки или ссылки «Печать для студента».

## Команды

```bash
npm install
npm run lint
npm run typecheck
npm run test
npm run spellcheck
npm run build
npm run test:e2e
npm run export:pdf
npm run check:pdf
```

Экспорт одной темы или варианта:

```bash
npm run export:pdf -- --topic s07-02-reliability-metrics
npm run export:pdf -- --topic s07-02-reliability-metrics --variant student
npm run export:pdf -- --topic s07-02-reliability-metrics --variant teacher
```

PDF сохраняются в `outputs/pdf/student` и `outputs/pdf/teacher`. Для подстановки данных преподавателя создайте `config/teacher-profile.json` по примеру `config/teacher-profile.example.json`.

## Публикация

- репозиторий: https://github.com/OlgaKraven/2026-OKFKS-lecture
- GitHub Pages: https://olgakraven.github.io/2026-OKFKS-lecture/
- материалы: https://disk.yandex.ru/d/Vz62H71Jub1GLA

GitHub Pages собирается через `.github/workflows/pages.yml`; Vite `base` равен `/2026-OKFKS-lecture/`. Ссылка на материалы предоставлена пользователем и не открывалась при подготовке проекта; наличие и состав файлов не заявляются.

## Источники и ограничения

Реестр: `src/data/sourceRegistry.ts`, описание: `SOURCES.md`, исходный мастер-промпт: `PROMPT.md`. Специальность, квалификация, курс, форма обучения, название профессионального модуля и расшифровки компетенций не добавлены, поскольку их нет в предоставленном источнике.
