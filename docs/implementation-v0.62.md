# Implementacja 0.62 — transfer między orbitą i powierzchnią

Przejście na Księżyc nadal wymaga rozpoznanej trasy, podejścia do bramy, prędkości poniżej 60 m/s i **E przez 2 s** bez walki ani innych akcji. Ostatnie 0,4 s podejścia wygasza widok. Puszczenie E lub naruszenie warunków przed zakończeniem podejścia anuluje przejście i wygaszenie.

## Animacja i sterowanie

Po zatwierdzeniu przejścia obszar i położenie zmieniają się w zasłoniętej klatce, a następnie przez **1,2 s** widoczny jest animowany księżycowy horyzont. Wejściu towarzyszy zbliżenie, odlotowi oddalenie kamery. Horyzont i podpis wygaszają się do docelowego widoku. HUD jest ukryty podczas właściwego transferu i powraca po nim. Widok dopasowuje się do dotychczasowej przestrzeni interfejsu 1600×900.

Sterowanie lotem, bronią, interakcjami i skrótami jest zablokowane. Stan klawiszy i przycisków jest czyszczony; pauza i panel misji pozostają dostępne. Pauza oraz utrata fokusu zatrzymują również animację. Przytrzymane E nie uruchamia automatycznie przejścia w przeciwnym kierunku.

Podczas 1,2 s właściwego transferu symulacja nie wykonuje kroków świata: nie biegnie czas misji, produkcja załogi, cooldowny, naprawy, ostrzał ani wydobycie Muła. Krótka pauza obejmuje obie strony walki. Animacja wynika z czasu kroków, dzięki czemu wznowienie nie pomija jej po utracie fokusu.

## Zachowanie postępu

Przejście zachowuje ładunek, uszkodzenia, tarczę, zestawy, raporty i fizyczny hol. Dołączony ładunek holowany trafia do nowego obszaru razem ze statkiem. Obszar i ostatnia pozycja są zapisywane przez dotychczasowy mechanizm zmiany instancji. Nie dodano wznawiania lotu ani animacji z zapisu. Format kampanii **39**, dziennika **18**, bez migracji starszych formatów.

## Weryfikacja

**418/418 testów**, bez pominięć. Typecheck, lint, produkcyjny build i kontrola diff przechodzą. Końcowy build nie zawiera strony ani bundla QA.

- Nowy test przejścia w obu kierunkach sprawdza, że nawet przy jednoczesnym wciśnięciu lotu, obrotu, broni, naprawy, interakcji i sabotażu czas i stan świata pozostają niezmienione przez właściwy transfer. Sprawdza również stan ładunku, tarczy, kadłuba, zestawów, Muła, brak dodatkowych pocisków oraz ochronę przed powrotem przez trzymane E.
- Druga nowa próba anuluje podejście podczas wygaszania i potwierdza powrót zwykłego sterowania.
- Dotychczasowy test przejścia nadal sprawdza rzeczywisty hol i zachowanie jego położenia. Zwykłe loty z dostawami, wydobycie, eskorta Muła i ataki na placówkę czekają teraz na zakończenie animacji przed kolejnym działaniem.
- Przeglądarka 1280×720: wejście i wyjście przez rzeczywistą interakcję E, widoczna animacja, ukrycie i przywrócenie HUD, brak błędów konsoli. Przygotowana scena QA ustawia statek przy bramie orbitalnej i wyłącza przeciwników; nie zastępuje pełnej wyprawy z walką. Tymczasowa strona i bundle są usuwane przez końcowy build produkcyjny.

Dowody: [wejście nad powierzchnię](validation-v0.62/descent.png), [odlot na orbitę](validation-v0.62/ascent.png).

## Kolejny pakiet

Role przeciwników i bazy regularnie wysyłające posiłki, z powiązaniem wyłączenia produkcji z rzeczywistym zniszczeniem bazy. Animacje dokowania oraz drony strażnicze Satuk 15 pozostają osobnymi pakietami.
