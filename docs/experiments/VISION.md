# Wizja: bogatszy język wizualny PR Lens

## Kierunek ustalony z użytkownikiem

PR Lens ma przejąć możliwości wizualnego przedstawiania problemów znane z Mermaida, zachowując własny JSON, styl i animowany SVG osadzany w Markdownie. Mermaid jest referencją rodzajów diagramów i ich elementów. Nie jest formatem wejściowym, zależnością produktu ani silnikiem renderowania.

Dotyczy to bogactwa form: decyzji, stanów, tabel encji, klas, drzew, grup, osi czasu i oznaczeń relacji. Nie oznacza kopiowania wyglądu Mermaida piksel po pikselu. Każda forma otrzymuje paletę, typografię, oznaczenia zmian i sposób prowadzenia wzroku właściwy dla PR Lens.

Obecny eksperyment weryfikuje trzy rodziny. Wizja jest szersza i nie ogranicza przyszłego narzędzia do rozumienia diffu: diagram może też objaśniać działający system, algorytm lub projektowane rozwiązanie.

## Możliwości do rozwijania

| Rodzina | Elementy wizualne | Przykład zastosowania | Miejsce w pracach |
|---|---|---|---|
| Flowchart | Start/koniec, proces, decyzja, datastore, podpisane wyjścia, grupy, powroty i połączenia ścieżek | Walidacja, cache, obsługa błędów | Eksperyment 01 |
| Sekwencja | Uczestnicy, lifelines, aktywacje, request/return/self, bloki alternatyw, powtórzeń i równoległości | Timeout, retry, wywołania kilku usług | Eksperyment 02 |
| ER | Encje z wierszami pól, typy, PK/FK, opcjonalność i liczność relacji | Zmiana modelu danych | Eksperyment 03 |
| Maszyna stanów | Stan początkowy i końcowy, przejścia, zdarzenia, warunki; później stany złożone | Cykl życia płatności lub zadania | Następny kandydat po eksperymencie |
| Klasy i typy | Przedziały pól/metod, dziedziczenie, implementacja, kompozycja | Refaktor interfejsów i modelu domenowego | Później |
| Drzewa i mindmapy | Układ hierarchiczny, grupy, korzeń i poddrzewa | Zależności, struktura decyzji, przechodzenie po drzewie | Później |
| Oś czasu i Gantt | Zdarzenia, przedziały, zależności, kamienie milowe | Przebieg wdrożenia lub zadania | Później |
| Wykresy ilościowe | Osie, serie, skale, legenda, jednostki; później przepływy o określonej wielkości | Benchmarki, rozkład kosztu, wolumen danych | Później, na podstawie dostarczonych danych |

To katalog kierunków, nie zobowiązanie do implementacji każdego typu. W szczególności eksperyment nie obejmuje wszystkich kształtów flowchartów, zaawansowanego UML, dowolnej głębokości grup ani pełnego modelowania czasu rzeczywistego.

## Animacja jako objaśnienie

Diagram przedstawia pełną strukturę, a scenariusz prowadzi przez konkretny przebieg. Przykładowo ten sam flowchart cache może pokazać hit, miss albo błąd. W sekwencji można zobaczyć szybki sukces lub timeout zakończony retry. W ER animacja objaśnia nowe pole i nową relację.

Scenariusz jest opisany w JSON-ie. Renderer nie wykonuje kodu, nie ocenia warunków i nie symuluje sieci. Czasy animacji służą czytelności; nie sugerują rzeczywistych pomiarów opóźnień. Dane z benchmarków i liczniki muszą pochodzić z dostarczonego źródła, jeśli diagram ma przedstawiać faktyczne wartości.

Animacja może prowadzić po połączeniu, wyróżnić aktywny element, oznaczyć powtórzenie, pokazać wspólny początek równoległych działań lub objaśnić zmianę elementu. Rodzaj ruchu zależy od znaczenia: relacja ER nie otrzymuje domyślnie ruchomej kropki sugerującej ruch danych.

Wyróżnienie aktywności pozostaje odrębne od kolorów zmian. Zielona ramka oznacza dodany element, a nie dowolny element aktualnie odtwarzany. Numery kroków, podpisy, strzałki, znaczniki i kreskowanie pozwalają zrozumieć materiał także bez ruchu i bez polegania wyłącznie na kolorze.

## Natywny opis i własny renderer

Modele odpowiadają znaczeniu diagramów. Flowchart nie potrzebuje fikcyjnych pasów architektury. Encja ma prawdziwe pola oraz końce relacji, zamiast etykiety udającej tabelę. Sekwencja opisuje strukturę kroków, zamiast wpisywać warunki do tekstu strzałki.

Wspólne pozostają stabilne identyfikatory, krótkie etykiety, metadane zmian, opcjonalne odnośniki do kodu, paleta i podstawowe elementy SVG. Układy są właściwe dla rodziny: graf, kolumny sekwencji, tabele encji, drzewo albo osie. Nie wymuszamy jednego układu na wszystkie rodziny.

Pierwsze przykłady mogą być napisane ręcznie lub przez agenta na podstawie dokumentacji JSON. Automatyczne wybieranie rodzaju diagramu z diffu jest osobnym, późniejszym tematem. W eksperymencie nie zmieniamy inferencji `analyze`.

## SVG i canvas

Pierwszym wynikiem jest samodzielny SVG: własne kolory, elementy wektorowe, animacja CSS/SMIL, brak skryptów i zewnętrznych zależności. Markdown otrzymuje obraz wybranego scenariusza. Renderer zapewnia także wersję statyczną.

Przyszły canvas może przełączać scenariusze, sterować odtwarzaniem i pokazywać kod lub payload wskazanego elementu. To rozwinięcie istniejącego canvasu PR Lens. Sama możliwość wyeksportowania SVG ma pozostać niezależna od hostowanego viewera.

Eksperyment nie obiecuje, że każdy program czytający Markdown zachowa animację. Weryfikujemy przeglądarkę i GitHub Markdown; dla pozostałych odbiorców jest czytelna wersja statyczna.

## Co odkładamy z Sideshow

Kompozycję różnych rodzajów treści, zestawy gotowych elementów objaśnień i rozmowę przy konkretnym fragmencie prezentacji zapisano w [SIDESHOW.md](SIDESHOW.md). Nie są wymaganiem pierwszego renderera nowych diagramów.

## Źródła odniesienia

- [Flowcharty Mermaid](https://mermaid.js.org/syntax/flowchart.html) — kształty, połączenia i grupowanie.
- [Sekwencje Mermaid](https://mermaid.js.org/syntax/sequenceDiagram.html) — wizualne bloki i oznaczenia komunikatów.
- [ER Mermaid](https://mermaid.js.org/syntax/entityRelationshipDiagram.html) — pola, klucze i liczność relacji.
- [Stany Mermaid](https://mermaid.js.org/syntax/stateDiagram.html) — przejścia i grupowanie stanów.
- [Obecny kontrakt PR Lens](https://github.com/coldteadotai/pr-lens/blob/7a9115c8202da4db030be5954ada8862e6135dce/packages/schema/src/graph.ts) oraz [renderer](https://github.com/coldteadotai/pr-lens/blob/7a9115c8202da4db030be5954ada8862e6135dce/packages/renderer/README.md).
- [SVG jako obraz](https://developer.mozilla.org/en-US/docs/Web/SVG/Guides/SVG_as_an_image) — ograniczenia kontekstu obrazu.

Dokumentacja Mermaida służy oglądaniu i porównywaniu form diagramów. Nie ustanawia kompatybilności składni, API ani formatu plików.
