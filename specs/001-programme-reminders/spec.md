# Feature Specification: Programme Reminders

**Feature Branch**: `lab4-exercicio` (feature id `001-programme-reminders`)

**Created**: 2026-11-25

**Status**: Draft

**Input**: User description: "Programme reminders - notify 10 minutes before a favourite starts"

## Clarifications

### Session 2026-11-25

- Q: Os lembretes devem aparecer só com o guia aberto ou também com ele fechado? → A: Só com o guia aberto (aviso na tela); notificação com o guia fechado fica fora desta versão.
- Q: De onde o guia tira "agora" para decidir quando faltam 10 minutos? → A: Relógio real por padrão, com um horário "agora" que pode ser definido para testes e demonstração.
- Q: Após recarregar a página, um lembrete já mostrado ou dispensado reaparece? → A: Não; o guia lembra no navegador os lembretes já mostrados ou dispensados.
- Q: Um lembrete não dispensado some sozinho ou fica até ser dispensado? → A: Some sozinho quando o programa começa; o viewer também pode dispensar antes.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Get warned 10 minutes before a programme on a favourite channel (Priority: P1)

A viewer who has marked channels as favourites opens the programme guide and keeps it open. Ten minutes before any programme starts on one of those favourite channels, the guide shows a reminder naming the programme, its channel and its start time, so the viewer does not miss it.

**Why this priority**: This is the whole feature. Without this reminder nothing else has value, and it can be delivered and demonstrated on its own.

**Independent Test**: Favourite one channel, make time reach 10 minutes before a programme on that channel, and confirm exactly one reminder appears with the right programme title, channel name and start time (São Paulo time).

**Acceptance Scenarios**:

1. **Given** channel A is a favourite and a programme on A starts at 20:00, **When** the time reaches 19:50, **Then** the viewer sees one reminder showing the programme title, channel name and start time "20:00".
2. **Given** channel B is not a favourite and a programme on B starts at 20:00, **When** the time reaches 19:50, **Then** no reminder is shown for it.
3. **Given** a reminder was already shown for a programme, **When** time moves on until the programme starts, **Then** that programme does not trigger a second reminder.
4. **Given** two programmes on two favourite channels both start at 20:00, **When** the time reaches 19:50, **Then** the viewer sees a reminder for each of them.

---

### User Story 2 - Reminders follow changes to favourites (Priority: P2)

When the viewer adds or removes a favourite, reminders adjust immediately: a newly favourited channel starts producing reminders for its upcoming programmes, and an unfavourited channel stops producing them.

**Why this priority**: Reminders that ignore the current favourites list would be confusing or annoying, but the feature still works in a basic form without this polish.

**Independent Test**: Favourite a channel, then remove it before the 10-minute mark of its next programme, and confirm no reminder appears; repeat in reverse and confirm one does.

**Acceptance Scenarios**:

1. **Given** the viewer removes channel A from favourites at 19:45, **When** the time reaches 19:50 for a programme on A, **Then** no reminder is shown.
2. **Given** the viewer adds channel A to favourites at 19:45, **When** the time reaches 19:50 for a programme on A, **Then** a reminder is shown.
3. **Given** a reminder for a programme on channel A is visible, **When** the viewer removes channel A from favourites, **Then** that reminder disappears.

---

### User Story 3 - Dismiss reminders and avoid confusing ones (Priority: P3)

The viewer can dismiss a reminder. If the viewer opens the guide late, the viewer is not flooded with reminders for programmes that have already started or are about to start in under a minute.

**Why this priority**: Improves comfort and trust, but the feature is useful without it.

**Independent Test**: Show a reminder and dismiss it; open the guide 3 minutes before a programme and confirm only a single, correctly worded reminder appears.

**Acceptance Scenarios**:

1. **Given** a reminder is visible, **When** the viewer dismisses it, **Then** it disappears and does not come back for that programme.
2. **Given** the viewer opens the guide at 19:57 and a favourite channel's programme starts at 20:00, **When** the guide loads, **Then** the viewer sees a reminder showing that the programme starts in 3 minutes (not "10 minutes").
3. **Given** a programme on a favourite channel has already started when the guide opens, **When** the guide loads, **Then** no reminder is shown for it.

---

### Edge Cases

- A programme starts exactly at 00:00 or another day boundary: the reminder at 23:50 still appears, with the correct start time, despite crossing midnight in São Paulo.
- A favourite channel has back-to-back programmes (one ends when the next starts): each programme gets its own reminder 10 minutes before its own start.
- A programme starts less than 10 minutes after the viewer opens the guide, or after the viewer favourites the channel: the reminder appears right away and states the real minutes remaining.
- The viewer has no favourites: no reminders are shown and no error appears.
- The viewer hits the 50-favourite limit: reminders work for all saved favourites.
- A channel has no programmes in the schedule for the upcoming period: nothing is shown, no error.
- The server restarts and favourites are lost: reminders stop for those channels until the viewer favourites them again.
- The viewer's device clock is wrong: with the real-time default, reminders follow that clock and may appear early or late (accepted limitation); the overridable "now" is the way to get predictable behaviour.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST show a reminder to the viewer when a programme on one of the viewer's favourite channels is 10 minutes from its start.
- **FR-002**: Each reminder MUST show the programme title, the channel name and the start time, in São Paulo time.
- **FR-003**: The system MUST NOT show reminders for programmes on channels that are not favourites.
- **FR-004**: The system MUST show at most one reminder per programme for the viewer, including after dismissal and after the page is reloaded; reminders already shown or dismissed are remembered in the viewer's browser.
- **FR-005**: The system MUST react to favourites being added or removed without the viewer reloading the guide.
- **FR-006**: If a programme starts in less than 10 minutes when the system first becomes aware of it (guide opened late, or channel just favourited), the reminder MUST appear immediately and state the real minutes remaining.
- **FR-007**: The system MUST NOT show reminders for programmes that have already started.
- **FR-008**: The viewer MUST be able to dismiss a reminder. A reminder that was not dismissed MUST disappear on its own when its programme starts.
- **FR-009**: Reminders MUST handle programmes that start on a different São Paulo day than the viewer's current moment, including across midnight.
- **FR-010**: Each reminder MUST carry the programme's ClassInd rating so that rating-based restrictions can be applied to reminders. Filtering by rating is out of scope for this version because no kids profile exists yet; once it does, programmes rated `18` MUST NOT produce reminders for it.
- **FR-011**: Programme times used for reminders MUST come from the existing programme schedule, with no change to how the schedule is produced.
- **FR-012**: Reminders MUST appear only while the guide is open in the viewer's browser; no notification is delivered when the guide is closed.
- **FR-013**: The current moment used for reminders MUST default to the real time, and MUST be overridable with a chosen "now" so reminders can be tested and demonstrated deterministically.

### Key Entities *(include if feature involves data)*

- **Favourite channel**: A channel the viewer marked as favourite; the set that decides which programmes may trigger reminders.
- **Programme**: An entry in a channel's schedule with a title, a start time, an end time and a rating.
- **Reminder**: A notice about one programme, tied to the viewer and the programme, with the minutes remaining before start and whether it was shown or dismissed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For a favourite channel, 100% of programmes that start while the guide is open produce exactly one reminder, shown within 30 seconds of the 10-minute mark.
- **SC-002**: 0 reminders are shown for channels that are not favourites.
- **SC-003**: After the viewer changes favourites, reminders reflect the change within 30 seconds, with no page reload.
- **SC-004**: A viewer can dismiss a reminder in a single action.
- **SC-005**: Reminders show the correct São Paulo start time in 100% of the cases tested, including programmes crossing midnight.

## Assumptions

- "Favourite" refers to the existing favourite channels. A reminder covers every programme that starts on a favourite channel, not individual programmes the viewer picks.
- Reminders are shown inside the web guide while it is open. Notifications to a closed browser, phone or email are out of scope for this version.
- The only viewer identity is the existing fixed demo user; there is no sign-in, and favourites remain in server memory as today.
- The 10-minute lead time is fixed in this version; making it configurable is out of scope.
- No sound or system-level notification is required; an on-screen notice is enough.
- Which reminders were shown or dismissed is kept only in the viewer's browser; clearing browser data may make a reminder appear again.
- Times follow the existing rule: São Paulo time with a fixed -03:00 offset.
- The guide's date is currently fixed in the web interface; reminders rely on the programme times in the schedule data and on the current moment, which is why the "now" can be overridden (FR-013).
