# Implementacja 0.58 — eskorta wydobywcza Muła

Stan: 2026-10-16. Dodatkowa misja ziemska w pakiecie pełniejszego aktu I.

## Grywalna misja

Po ukończeniu **Zaplecza stacji** pojawia się **Eskorta wydobywcza Muła**. To zadanie dodatkowe; nie blokuje trasy na Księżyc ani dalszych aktów. Transport pojawia się wyłącznie po wybraniu tej misji przed startem. Gracz nie musi posiadać Muła we własnej flocie.

Przy Satuk 15 czeka sojuszniczy Muł AI. **N** wskazuje transport, **E przez 2 s** przy spokojnym podejściu rozpoczyna eskortę. Muł wyznacza drogę do oddzielnego złoża, omija skały i czeka po oddaleniu gracza na więcej niż 650 m. Początkowy obszar ziemski jest już rozszerzony przez wymagania zadania.

Po wyjściu w dalszą przestrzeń pojawia się zasadzka dwóch dronów. Przeciwnicy mogą ostrzeliwać transport; podczas zagrożenia w pobliżu złoża Muł wstrzymuje wydobycie. Po zabezpieczeniu rejonu obraca się ku skale i używa widocznej wiązki. Faktyczne obrażenia niszczą asteroidy, a powstała ruda trafia z istniejącej mapy łupu do ładowni AI. Nie jest to przyrost ładunku z timera. Transport pobiera tylko rudę pochodzącą ze skał, nie łup po wrogach; nie przejmuje zasobu, który już obsługuje chwytak gracza.

Złoże ma osiem skał po 38 m promienia, zapewniających łącznie 24 Fe. Pozostawione podejścia umożliwiają nawigację do środka. Celem Muła jest **12 Fe**, więc część surowców może zebrać gracz. Po załadunku transport wraca fizycznie do doku, nadal wymagając eskorty. Dopiero wtedy odczyt `escort` trafia do raportu wyprawy i otwiera zwykłe dokowanie gracza.

Powrót gracza zatwierdza zadanie jednokrotnie: **12 Fe przewiezionego ładunku + 4 komponenty premii** rozliczane są przez nagrodę misji. Ładunek zebrany przez gracza rozlicza się osobno. Obowiązuje pojemność magazynu i dotychczasowa obsługa przepełnienia. Przyznanie dostawy i nagrody następuje po raporcie gracza, nie od razu przy powrocie AI.

Zniszczenie Muła, śmierć gracza lub odwrót nie przyznają raportu. Brak skał i dostępnej rudy przed załadunkiem kończy próbę czytelnym komunikatem o wyczerpaniu złoża; nie generuje materiałów zastępczych. **TAB → odwrót** pozwala wrócić i ponowić zadanie ze świeżym transportem oraz złożem. Celów nie zalicza sam pusty statek w doku.

## Oprawa

Transport korzysta z istniejącej sylwetki Muła, paska kadłuba i widocznej wiązki wydobywczej. HUD pokazuje etap, stan kadłuba, ilość Fe, oczekiwanie, powrót i przyczynę porażki. Nawigacja N kieruje do Muła. Stara eskorta badawcza Keplera i jej anomalia pozostają niezależne.

## Zapis

Format kampanii **37**, dziennika **16** — nowy identyfikator zadania i pole postępu. Starsze formaty są odrzucane; brak migracji. Aktywne wyprawy nie są wznawiane po odświeżeniu.

## Weryfikacja

- **410/410 testów**, bez pominięć; pięć nowych przypadków eskorty wydobywczej.
- Pełny test zwykłej symulacji: bazowy Prospector rozpoczyna eskortę przez interakcję, fizycznie leci przy AI, odpiera zasadzkę istniejącym uzbrojeniem, obserwuje rozbijanie skał i pobieranie łupu, osłania powrót Muła, sam dokuje i zatwierdza jednorazowy raport. Test nie teleportuje transportu ani gracza i nie dodaje rudy do ładowni AI. Wejście przygotowuje legalnie odblokowane zaplecze; nie zastępuje sesji całej kampanii od początku.
- Osobne przypadki: odblokowanie i brak transportu przy swobodnym locie, oczekiwanie na gracza i brak ukończenia z pustą ładownią, wyczerpanie złoża, zniszczenie załadowanego transportu rzeczywistym pociskiem, brak nagrody oraz świeża próba po odwrocie.
- Zaktualizowane starsze próby sprawdzają właściwe zadania sektora i ujawnienie ziemskiej odprawy po Marsie zamiast stałej liczby kart sprzed dodania misji.
- Typecheck, lint i produkcyjny build przeszły.
- Przeglądarka 1280×720: dostępność i opis zadania, wybór rozkazu, start, sylwetka Muła, rozpoczęcie E, widoczny lot AI i oczekiwanie po pozostawieniu gracza. Brak błędów konsoli. Zapis wejściowy miał przygotowane ukończone zaplecze i odprawy; pełną walkę, wydobycie i powrót sprawdzono w symulacji, nie w tej sesji przeglądarki.

Dowody: [wybór misji](validation-v0.58/mission.png), [Muł po starcie](validation-v0.58/mule.png), [oczekiwanie na eskortę](validation-v0.58/departure.png).

## Kolejny krok

Pełniejsza misja ratunkowa oraz rozwój powierzchni Księżyca. Dalszy balans długości eskorty, dodatkowe warianty zasadzek, nowe role przeciwników, bazy produkujące wrogów i drony strażnicze pozostają w backlogu.
