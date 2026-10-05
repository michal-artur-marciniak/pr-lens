# Sideshow: pomysły zachowane na później

## Status

To materiał odniesienia do wizji. Użytkownik zdecydował, że obecnie skupiamy się na możliwościach wizualnych diagramów znanych z Mermaida. Żaden punkt tego dokumentu nie jest zależnością eksperymentu ani wymaganiem trzech zaplanowanych PR-ów.

Analizowane repozytorium: [modem-dev/sideshow](https://github.com/modem-dev/sideshow), snapshot `a3b18af5a77f40889ec1f06359a277ccc61310ff`, data analizy 2026-10-05.

## 1. Kompozycja treści

Sideshow przedstawia materiał jako uporządkowaną listę bloków: diagram, Markdown, kod, diff, JSON, obraz lub HTML. W PR Lens warto później połączyć diagram z fragmentem kodu, payloadem i krótkim uzasadnieniem.

Przykład docelowy: krok „walidacja odrzuca request” wyróżnia gałąź diagramu, odpowiedni warunek w kodzie oraz pole requestu. Nowe rodzaje diagramów powinny zachować stabilne id i atlas, żeby taką synchronizację można było dodać później.

Referencje: [model postów i powierzchni](https://github.com/modem-dev/sideshow/blob/a3b18af5a77f40889ec1f06359a277ccc61310ff/server/types.ts), [przewodnik projektowy](https://github.com/modem-dev/sideshow/blob/a3b18af5a77f40889ec1f06359a277ccc61310ff/guide/DESIGN_GUIDE.md).

## 2. Zestawy gotowych elementów

Mechanizm `kits` udostępnia wspólny wygląd i zachowanie elementów, żeby agent opisywał treść, zamiast odtwarzać cały design system. Sideshow ma m.in. zestawy dla statusów i slajdów.

Możliwe zestawy PR Lens to własna, późniejsza propozycja: kolejka producent/konsument, stos wywołań, przechodzenie po drzewie, cache, retry na osi czasu. Powinny korzystać z natywnych danych i elementów SVG. Nie stanowią deklaracji, że Sideshow ma już gotowe renderery tych algorytmów.

Referencja: [registry kits](https://github.com/modem-dev/sideshow/blob/a3b18af5a77f40889ec1f06359a277ccc61310ff/server/kits.ts).

## 3. Iterowanie na tej samej prezentacji

Sideshow aktualizuje istniejący materiał, zachowuje wersje i odbiera komentarze użytkownika. PR Lens już ma canvas, walkthrough, rewizje i połączenie z agentem. Dalszy rozwój może objąć porównanie wariantów, objaśnienie wskazanego pola lub bloku i aktualizację konkretnego fragmentu prezentacji.

Referencje: [instrukcje iteracji i feedbacku](https://github.com/modem-dev/sideshow/blob/a3b18af5a77f40889ec1f06359a277ccc61310ff/guide/AGENT_HOWTO.md), [istniejący protokół live PR Lens](https://github.com/coldteadotai/pr-lens/blob/7a9115c8202da4db030be5954ada8862e6135dce/packages/schema/src/live.ts).

## 4. Własny viewer jako miejsce interakcji

W przyszłym viewerze można przełączać scenariusze, zatrzymywać animację, otwierać payload lub zestawiać diagram z wykresem benchmarku. Swobodne HTML wymaga odrębnej, sandboxowanej powierzchni, tak jak w Sideshow; nie staje się automatycznie eksportowalnym SVG.

Sideshow renderuje Mermaid w przeglądarce i oferuje eksport prezentacji do PNG. Nie traktujemy tego jako gotowego mechanizmu eksportu animowanych SVG dla PR Lens. Obecny eksperyment wytwarza własne SVG bez HTML i JavaScript.

Referencje: [renderowanie powierzchni](https://github.com/modem-dev/sideshow/blob/a3b18af5a77f40889ec1f06359a277ccc61310ff/server/surfacePage.ts), [eksport i udostępnianie](https://github.com/modem-dev/sideshow#run-it-anywhere).

## Warunek powrotu do tych pomysłów

Wrócić do kompozycji i interakcji po demonstracji nowych rodzajów diagramów. Potrzebne będą działające natywne modele, sensowne scenariusze, atlas i potwierdzona czytelność samodzielnego SVG. Ten dokument nie wymaga przenoszenia całej aplikacji Sideshow, jego serwera, MCP ani systemu przechowywania.
