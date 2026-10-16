# Implementacja 0.60 — powierzchnia Księżyca

Promień instancji powierzchniowej rośnie z 1600 do **2600 m**. Wejście, wyjście, placówka, złoże początkowe i scenariusze obrony zachowują swoje położenia. Dodatkowa przestrzeń służy opcjonalnej wyprawie wydobywczej; główne dostawy nie wymagają dłuższych przelotów.

## Grzbiet miedziowy

Po rozpoznaniu trasy księżycowej na powierzchni dostępne jest **5 → Grzbiet miedziowy · Cu**, około 2 km od placówki. Dwanaście nieregularnie rozmieszczonych formacji zawiera rudę miedzi. To cel eksploracji i pozyskiwania zasobów, bez nowej pozycji dziennika, obowiązkowego rozkazu ani osobnej nagrody raportowej. Miedź zasila istniejący łańcuch przewodników i modułów zasilania.

Formacje mają nieruchome ciała fizyczne: można je ostrzeliwać i wydobywać, a kolizje nie wypychają całego złoża. Duże formacje po rozbiciu tworzą ruchome, niszczalne odłamki; surowce trzeba fizycznie zebrać i bezpiecznie dowieźć. Wcześniejsze luźne głazy w złożu początkowym pozostają ruchome, aby zachować jego drogi podejścia. Złoża odnawiają się przy kolejnym locie, zgodnie z dotychczasowym generowaniem sektora.

## Oprawa i nawigacja

Większy obszar ma rozłożone kratery i drobiny gruntu. Ciemne tarasy odróżniają grzbiet od kotliny placówki. Osobna etykieta opisuje opcjonalne wydobycie Cu; punkt jest dostępny w nawigacji i radarze. Komunikat wejścia oraz opis powierzchni na stacji wymieniają skrót 5.

Nie zmienia się struktura danych zapisu: kampania **38**, dziennik **17**, bez migracji wcześniejszych formatów. Zmiana mapy nie dodaje trwałego postępu wydobycia ani wznawiania aktywnego lotu.

## Weryfikacja

**416/416 testów**, bez pominięć. Typecheck, lint i produkcyjny build przechodzą.

- Nowa próba pełnej wyprawy bazowym Prospectorem: zwykły dolot do wejścia, przejście na powierzchnię, dolot do grzbietu, rzeczywiste wydobycie i zebranie Cu, powrót przez wyjście i dokowanie w Satuk 15. Bez teleportacji i ręcznego przyznawania ładunku. Test startuje z przygotowanego legalnego postępu do zwiadu Księżyca, nie zastępuje przejścia całego aktu od nowej kampanii.
- Test potwierdza nieruchome formacje, ruchome odłamki, położenie wewnątrz granic powierzchni, nawigację, dopisanie dostarczonej miedzi i poprawny zapis.
- Dotychczasowe próby budowy, dostaw, przejść i wydobycia początkowego nadal przechodzą.
- Przeglądarka 1280×720: widok terenu, etykiety, radar i wybór celu 5. Przygotowany tymczasowy build QA ustawia statek przy złożu na powierzchni i usuwa przeciwników; to kontrola oprawy, nie ręczne przejście wyprawy. Brak błędów konsoli. Końcowy produkcyjny build usuwa tymczasową stronę i bundle QA.

[Widok grzbietu](validation-v0.60/copper-ridge.png).

## Następny krok

Animowane przejścia między orbitą i powierzchnią, z blokadą sterowania na czas transferu. Potem kolejne role przeciwników, bazy wysyłające posiłki i drony strażnicze Satuk 15.
