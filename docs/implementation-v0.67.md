# 0.67: terminale, przekierowanie energii i specjalizacje hakowania

Stan: 2026-10-17.

## Grywalny zakres

Terminale w kampanii i trybie testowym korzystają z dwóch minigier. Nie ma już alternatywnej ścieżki zdobycia danych przez przytrzymywanie E ani wyłączenia skanera przez przytrzymywanie G. Osobny fizyczny odbiór uzbrojenia z magazynu Cerbera zachowuje dotychczasową interakcję; nie jest włamaniem.

- **E — obwód terminala**: plansza 4×3 z obracanymi prostymi i narożnymi segmentami. Należy doprowadzić sygnał od oznaczonego IN do OUT, następnie wybrać Pobierz dane. Połączony odcinek jest podświetlany. Układ jest deterministyczny dla wyprawy i ma rozwiązanie; dopuszcza też alternatywną poprawną trasę.
- **G — przekierowanie zasilania skanera**: trzy kanały z bieżącą oraz docelową wartością. Zmiana jednego przenosi jednostkę energii z sąsiada lub do niego, bez tworzenia energii. Dopiero zatwierdzenie poprawnego rozkładu pobiera jeden komponent z ładowni i wyłącza skaner na 20 s. Nie pobiera nic z magazynu stacji. Wykonany sabotaż pozostaje jednorazowy na wyprawę.

Przyciski pozwalają zatwierdzić albo przerwać interakcję. Zwolnienie E/G nie zamyka panelu; sterowanie lotem i bronią jest odcięte na czas pracy. Trafienie, utrata zasięgu, zbyt duża prędkość, przyspieszanie i sprzeczne narzędzia przerywają połączenie. Bezpośrednie zatwierdzenie ponownie sprawdza stan statku, koszt i otoczenie. Przerwana próba nie przyznaje danych ani nagrody. Po trafieniu również w tarczę trzeba połączyć się ponownie. Sprzątanie panelu obejmuje porażkę, koniec lotu i zamknięcie sandboxa.

## Specjalizacje i ryzyko

| Kadłub | Okno połączenia | Ślad po błędzie | Dodatkowa możliwość |
| --- | --- | --- | --- |
| Zwykły | 30 s | 30/100 | Obie minigry |
| Sokół | 45 s | 15/100 | Ciche, bardziej wybaczające włamanie |
| Feniks | 30 s | 30/100 | Przełam / alarm: natychmiastowe dane i pełny alarm |

Sokół nie dostaje automatycznej niewidzialności. Wszystkie kadłuby mogą rozwiązać obwód zwykłą metodą. Przełamanie Feniksa jest wyborem przy terminalu, bez zmiany laserów i rakiet. Pełny ślad lub upływ czasu zamyka nieudaną próbę i wywołuje alarm. Ślad pozostaje przy ponownym połączeniu, aby anulowanie nie zerowało błędów; poza interakcją wygasa o 2/s.

Alarm wzywa dwóch istniejących fizycznych strażników najwyżej raz na wyprawę; ich śmierć nie odnawia garnizonu. Wyłączenie skanera nie usuwa późniejszego alarmu wywołanego głośnym przełamaniem terminala. Nadal można przekierować zasilanie podczas alarmu, ale już wysłane jednostki kontynuują pościg. Skaner i alarm pozostają odrębnymi źródłami zagrożenia.

Świat nie pauzuje podczas minigry: działają fizyka, ostrzał, ruch AI i skaner. Zwykłe menu pauzy zachowuje swoje zasady. Pobranie danych daje ten sam pakiet i skrzynie co wcześniej, dokładnie raz. Zaliczenie raportu wymaga nadal bezpiecznego powrotu. Automatyczne zdawanie przez rozmowę i transfer ładunku pozostają osobnym zatwierdzonym pakietem.

## Technika i zapis

Wspólny model `TerminalPuzzle` opisuje obwód lub bilans energii, działania gracza, czas, ślad i wynik. Symulacja decyduje o łączności, kosztach, alarmie, strażnikach i danych. Panel Pixi rysuje model oraz przekazuje działania. To pozwala dodawać warianty zadań bez powielania zasad rozliczenia. Usunięto stare liczniki pobierania i sabotażu, ich konfigurację oraz pierścienie postępu. Opisy Sokoła i Feniksa oraz podpowiedzi terminali pokazują nowe funkcje.

Brak nowych pól trwałych: kampania 41, dziennik 19, bez migracji. Aktywna minigra nie jest wznawiana po odświeżeniu; obowiązuje dotychczasowa zasada straty aktywnej wyprawy. Nie rozszerzono fabuły anomalii ani gospodarki paliwem.

## Weryfikacja

- **453/453 testów**, bez pominięć. Dziewięć nowych testów obejmuje m.in. 1000 seedów dla obu typów plansz, rozwiązania wyznaczane z widocznych połączeń i wskaźników, bilans energii, specjalizacje, alarm, ponowienie, timeout i trafienie przed zatwierdzeniem.
- Zaktualizowane scenariusze infiltracji wykonują prawdziwe działania minigier zamiast podmieniania stanu zabezpieczeń. Zachowano zwykłe wyprawy Prospectora przy Jowiszu, Uranie, Neptunie i Plutonie: zdobycie komponentu przez wydobycie, dolot, zasilanie, włamanie, raport. Testy obejmują też priorytet ratunku, śmierć przed zatwierdzeniem, koszt raz i osobny odbiór sprzętu.
- `npm run typecheck`, `npm run lint`, `npm run build` i `git diff --check` sprawdzone przed zakończeniem pakietu.
- Przeglądarka: przy rzeczywistym wąskim widoku 580×787 ręcznie rozwiązano bilans zasilania i obwód oraz zatwierdzono oba. Komponent ubył dopiero po zatwierdzeniu, panel zniknął, dane pojawiły się na pokładzie. Osobno wykonano przełamanie Feniksa: czerwony radar i dwa fizyczne drony. Brak błędów konsoli. Użyto osobnego klucza zapisu QA i przygotowanego położenia przy terminalu; skaner miał wydłużone ciche okno wyłącznie w tym podglądzie. To sprawdzenie UI, nie pomiar trudności dolotu lub walki. Zdjęcia w `dist/qa067-power.jpg`, `dist/qa067-circuit.jpg` i `dist/qa067-phoenix.jpg`.

Pełne ciągłe przejście nowego zapisu oraz ostateczny balans czasu i alarmów pozostają pracą z testami graczy. Następny pakiet: Merkury, wydobycie Harpunem i materiał do ulepszeń tarcz kinetycznych.
