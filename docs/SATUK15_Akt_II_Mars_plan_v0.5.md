# SATUK 15 — Akt II: uzupełnienie planu v0.5

Źródło: doprecyzowanie autora w rozmowie. Ten dokument zastępuje sprzeczne założenia przestrzenne v0.4 i wdrożeń 0.118–0.122. Oryginał v0.4 pozostaje zachowany.

## Docelowy układ

Trzy oddzielne obszary orbitalne z własnymi granicami, radarem i tłem, połączone śluzami; osobno jedna powierzchnia Fobosa. Przelot śluzą zmienia obszar, a zwykły lot nie przenosi między mapami.

1. **Duża orbita Marsa:** około 75% obszaru pokrywają anomalie. Satuk 15 jest w lewym dolnym rogu; nad i pod stacją przemieszczają się grupy asteroid. Na prawo od stacji zaczyna się zawiły labirynt z odnogami i ślepymi zaułkami, prowadzący do śluzy Fobosa w prawym górnym rogu. W lewym górnym rogu znajduje się całkowicie odcięta anomalią śluza Deimosa. Zejście na Marsa w centrum obszaru również jest całkowicie odcięte. Deimos i powierzchnia Marsa pozostają niedostępne w tym etapie.
2. **Średnia orbita Fobosa:** około 25% anomalii, stara sonda, wrak dawnego modelu statku i pas przelatujących mniejszych asteroid. Początkowa zasadzka otwiera lądowanie na Fobosie. Zakończenie misji na Fobosie otwiera śluzę do obszaru asteroidy.
3. **Mały obszar asteroidy:** brak anomalii, duża asteroida i gęste skupisko pozostałych skał, przemysłowa baza wroga i liczni przeciwnicy.
4. **Powierzchnia Fobosa:** osadzone w gruncie złoża, średnia baza, drony poruszające się ustalonymi trasami oraz obracający się skaner jak u CERBERUSA w sandboxie. Szybka minigra układania ścieżki wyłącza instalację i patrolujące drony, które następnie można odholować. Wykrycie, nieudane włamanie lub rozpoczęcie walki uruchamia alarm i produkcję posiłków. Gracz może przerwać próbę i odlecieć.

Dotychczasowy fizyczny moduł pamięci i jego dostawa do Satuk 15 pozostają częścią łańcucha fabularnego. Otwarcie dalszej trasy zachowuje zależność od ukończenia misji i analizy danych.

## Warunki odbioru

- Każdy obszar pokazuje wyłącznie swoje znaczniki, grafikę i zagrożenia; radar oraz granice aktualizują się po śluzie.
- Obszary orbitalne nie mają wspólnego koła obejmującego wszystkie mapy; stacja pozostaje w bezpiecznej części orbity Marsa.
- Udział anomalii wynosi około 75% / 25% / 0%, mierzony wewnątrz granic odpowiednich map.
- Labirynt zawiera faktyczne rozgałęzienia i ślepe zaułki; nie jest samym szeregiem nawrotów.
- Lądowanie Fobosa wymaga pokonania zasadzki, a Deimos i Mars nie otwierają dodatkowych powierzchni.
- Włamanie korzysta z działającej minigry; świat i skaner pracują podczas połączenia.
- Ciche wyłączenie zamienia patrole w fizyczne obiekty do holowania, a alarm uruchamia posiłki.
- Postęp misji, fizyczny hol i sygnały ratunkowe zachowują właściwy obszar także po zapisie.
- Usunąć długie blokowanie wylotu: zmierzyć przygotowanie grafiki anomalii, ograniczyć koszt i wielkość cache, sprawdzić kolejne wyloty i sprzątanie.

## Kolejność wdrożenia

1. Oddzielne mapy, śluzy, tła, radary i granice oraz zgodność istniejących zapisów.
2. Geometria pokrycia anomaliami i rozgałęzionego labiryntu; asteroidy i dekoracje właściwe dla map.
3. Skaner, patrolujące drony, minigra i warianty alarmu/cichego wyłączenia.
4. Optymalizacja przygotowania anomalii i pomiary wylotu, testy regresji oraz kontrola wizualna.
## Status wdrożenia — 2026-10-22, 0.123

Punkty 1–4 wdrożone. [Raport implementacji i weryfikacji](implementation-v0.123.md) opisuje konkretne mapy, mechaniki, migrację oraz pomiary. Do dalszej pracy pozostaje ręczny balans i profil pamięci podczas długiej sesji; technologia wycinania anomalii jest osobnym późniejszym etapem.
