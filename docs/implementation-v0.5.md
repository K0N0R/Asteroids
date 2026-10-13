# Prototyp 0.5 — eksploracja i dane

## Nowe miejsca i skanowanie

Przekaźnik Lumen ma geometryczną antenę i panele słoneczne, a opuszczone obserwatorium Mnemos przerwany pierścień i rdzeń archiwum. Oba powstają z figur Pixi. Generator ustala ich położenie na podstawie seeda: Lumen znajduje się 1,5–2,1 km od Aurory, Mnemos 3,4–4,1 km. Odległość i kąt podejścia różnią się między sektorami. Początkowa strefa badania jest wolna od skał; ruchome asteroidy mogą do niej później wejść.

Skanowanie wymaga przytrzymania E przez 3 s, w odległości poniżej 180, z prędkością do 60, bez ciągu, strzelania, naprawy i świeżych uszkodzeń. Utrata warunków zeruje postęp. Widoczny pierścień pokazuje postęp, a zakończony skan pozostawia znacznik przy miejscu i na minimapie. Każde źródło daje dane tylko raz w wyprawie. Dane nie zajmują ładowni ani nie zmieniają sterowania.

Klawisze 1–5 zachowują wcześniejsze cele; 6 pozostaje sygnałem ratunkowym. 7 wskazuje Lumen, 8 Mnemos. Każde miejsce ma własny numer nawigacji, niezależny od kolejności tablicy. Po skanie HUD kieruje do brakującego celu przyjętego kontraktu albo do bazy. Akcja ratunkowa ma pierwszeństwo w bliskiej strefie, żeby jedno przytrzymanie E nie podejmowało kapsuły i nie skanowało jednocześnie.

## Kontrakty i progresja

| Kontrakt | Warunek | Premia | Odblokowanie |
| --- | --- | --- | --- |
| Pierwszy transport | 12 rudy | 10 rudy + 1 komponent | Od początku |
| Zaopatrzenie warsztatu | 20 rudy + 2 komponenty | 18 rudy + 2 komponenty | Od początku |
| Nasłuch sektora | Dane z Lumen | 18 rudy + 3 komponenty | Jeden udany powrót do bazy |
| Ślad dawnych gwiazd | Dane z Lumen i Mnemos z jednej wyprawy | 30 rudy + 5 komponentów | Wykonany Nasłuch sektora oraz warsztat I |

W bazie wybieramy jeden kontrakt; przyciski pokazują blokady, a panel podaje wymagania następnego odblokowania. HUD pokazuje konkretne brakujące dane. Wystarczy skanować miejsca w dowolnej kolejności. Powtórny skan jednego miejsca nie zastępuje drugiego.

Nagroda i licznik wykonanych kontraktów rosną dopiero po bezpiecznym dokowaniu, jeśli wymagania wybranego na starcie kontraktu są spełnione. Nie można zmienić kontraktu w locie. Premia jest dodatkiem do przywiezionego łupu. Rozliczenie respektuje magazyn i rezerwacje załogi; komponenty mają pierwszeństwo, nadwyżka przepada i jest raportowana. Pełny magazyn nie cofa ukończenia kontraktu.

Przegrana i odświeżenie w locie tracą dane. Udany powrót z częściowymi danymi zachowuje łup, ale nie daje premii badawczej; następną wyprawę zaczynamy bez danych. Można badać oba miejsca także podczas innych kontraktów i misji ratunkowych, lecz premię daje wyłącznie spełnienie przyjętego kontraktu. Historia ukończonych misji jest trwałą częścią bazy i nie przepada po późniejszej śmierci.

## Zapis i ograniczenia

Wewnętrzny format kampanii to 5, pod dotychczasowym kluczem localStorage. Migracja 1–4 zachowuje środki, pilotów, flotę, moduły, załogę, sygnały ratunkowe i aktywny znacznik wyprawy. Liczniki kontraktów startują od zera — starszy zapis nie mówi, które kontrakty faktycznie wykonano. Dawne udane powroty odblokowują jednak Nasłuch sektora.

Walidacja obejmuje nowe identyfikatory kontraktów, tablicę liczników i aktywne kontrakty badawcze. Znacznik aktywnej wyprawy nadal rozliczamy jako stratę; danych nie zapisujemy do wznowienia. Zmiana generatora może zmienić otoczenie sygnałów ze starszej wersji, mimo zachowania ich współrzędnych i seeda.

Kontrakty są powtarzalne; na razie nie ma frakcji, unikalnej fabuły, pełnej tablicy zleceń ani trwałego banku nieoddanych danych. Balans odległości i nagród jest roboczy. Zachowano obecne parametry lotu i kadłubów.

## Weryfikacja

Przeszły kontrola typów, lint, build produkcyjny oraz 52 testy. Nowe testy sprawdzają położenie i dostępność miejsc, nawigację 6–8, odblokowanie/wybór kontraktów, oba źródła danych, powtórne skany, stratę i odświeżenie, pełny magazyn, trwałość historii, migrację oraz rzeczywisty przebieg skanowania i dokowania w symulacji Rapier.

W odrębnej kampanii na porcie 3001 sprawdzono blokady na starcie oraz pełny Nasłuch sektora: wydobycie, awarię, naprawę, skan Lumen, automatyczny powrót nawigacji do Aurory i dokowanie. Baza przyjęła 8 rudy oraz premię 18 rudy i 3 komponentów. Po ponownym wczytaniu zachowała środki i licznik jednego wykonania. W drugim scenariuszu sprawdzono odblokowany daleki kontrakt, klawisz 8, skan Mnemos i pozostawienie Lumen jako brakującego celu. Konsola nie zgłosiła błędów ani ostrzeżeń.

Zrzuty: [kontrakty w bazie](screenshots/contracts-v0.5.jpg), [Lumen po skanie](screenshots/survey-relay-v0.5.jpg), [rozliczenie](screenshots/survey-result-v0.5.jpg), [Mnemos po skanie](screenshots/survey-observatory-v0.5.jpg).
