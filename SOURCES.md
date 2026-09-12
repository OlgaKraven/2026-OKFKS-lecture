# Источники текущей миграции

Старый реестр сохранён в `authoring/legacy/SOURCES.md` и `authoring/source-registry.json`. Исторические даты в нём не означают новую проверку источника.

- Программа: текст внутри `PROMPT.md`; исходные названия и часы перенесены в `authoring/course-map.json`. Полная утверждённая РПД не предоставлялась.
- Правила: переданная «Единая инструкция создания и переработки учебных веб-лекций по РПД», редакция 12.09.2026, включая дополнения о литературе, материалах, карте темы и контекстных заметках.
- Шаблон: [commit aba617d](https://github.com/OlgaKraven/2026-lecture-shablone/tree/aba617d886eb33194e5c1283049f23a9d4452464). Фактические модель, рендерер, протокол, печать и scoring прочитаны локально. Исходный commit отличается от исторической привязки в инструкции.
- Содержательная доработка: `authoring/context.mjs` и зафиксированные корректировки в генераторе. Числовые ситуации — авторские учебные данные, а не статистика организаций или цитаты из книг.
- Библиография: четыре полных описания и URL из прежнего генератора сохранены без подстановки литературы демонстрации.

Для проверки технического контекста 12.09.2026 использована выдача официальных первичных источников:

- [Get-WinEvent](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.diagnostics/get-winevent?view=powershell-7.5): чтение журналов событий.
- [Get-MpComputerStatus](https://learn.microsoft.com/de-de/powershell/module/defender/get-mpcomputerstatus?view=windowsserver2022-ps): команда сообщает состояние защиты, что не является проверкой всех сценариев обнаружения.
- [BitLocker overview](https://learn.microsoft.com/en-us/windows/security/operating-system-security/data-protection/bitlocker/index): защита томов и сценарии утраты устройств.
- [Управление Windows Firewall](https://learn.microsoft.com/en-us/windows/security/operating-system-security/network-security/windows-firewall/configure-with-command-line): правила и контекст управления. Новые команды изменения действующей системы не добавлялись.

Общие утверждения о версии Windows 11 24H2 сохранены как граница исходного учебного стенда, а не рекомендация актуальной версии ОС. Источники не использовались для выдумывания нормативных чисел парольной политики, гарантий шифрования или универсальных порогов мониторинга.
