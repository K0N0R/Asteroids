# 0.136 — ekspedycja naukowa Keplera na Marsie

Stan: 2026-10-24. Aplikacja 0.136.0. Format kampanii 67 i dziennika 32 bez resetu. Dotychczas ukończona ekspedycja pozostaje ukończona.

## Przebieg

1. Kepler rozpoczyna przy Satuk 15, po przytrzymaniu F.
2. Pierwszy pomiar: północ stacji, `(0, -2550)`, tuż przy brzegu anomalii.
3. Drugi pomiar: wejście do labiryntu, `(2850, 1100)`.
4. Trzeci pomiar: pierwszy dalszy korytarz labiryntu, `(5200, -200)`.
5. Po trzecim skanie statek z danymi wraca fizycznie do Satuk 15. Na tym odcinku następuje czwarty nalot.
6. Sukces następuje po dotarciu żywego Keplera do doku. Dopiero wtedy kończy się zadanie i dane są przyjęte przez stację. Gracz wraca, żeby odebrać odprawę.

Pomiar trwa 12 s bez bliskich zagrożeń. Oddalenie eskorty wstrzymuje lot. Skaner obraca statek ku rzeczywistemu brzegowi anomalii, rysuje półprzezroczysty stożek, ruchomą wiązkę, punkt pomiaru i rozchodzące się impulsy na badanym materiale. Nie ma koła postępu wokół Keplera ani osobnej fikcyjnej anomalii na środku stanowiska. Pod ostrzałem skaner jest przygaszony i nie wykonuje aktywnych impulsów.

## Nawigacja i drony

- Planowanie sprawdza całe odcinki drogi względem pola anomalii, również przekątne siatki i skróty wygładzonej trasy. Uwzględnia poruszające się skały. Kepler nie wybiera prostej przecinającej skażony obszar.
- Margines planowania wynosi 90 jednostek. Kontrola przewidywanego ruchu zatrzymuje wejście na brzeg, a po fizyce kontrolowana jest możliwość wypchnięcia statku przez kolizję. Test całej trasy sprawdza rzeczywiste położenie po każdym kroku.
- Fale liczą 2, 3 i 4 jednostki przy kolejnych stanowiskach oraz 3 w drodze powrotnej. Łącznie 12 dronów. Nie są tworzone podczas generowania mapy ani ponownego przeliczenia jej układu.
- Każdy punkt wejścia musi mieścić cały dron poza aktualnym widokiem, z marginesem na ruch kamery, i leżeć w bezpiecznej części pola, poza skałami oraz ochroną stacji. Musi mieć także bezpieczną trasę do eskorty. Jeśli nie ma odpowiedniego miejsca, fala czeka; nie ma awaryjnego pojawiania się na ekranie lub wewnątrz anomalii.
- Drony rzeczywiście przylatują korytarzami. Dalekie jednostki dostają trasę do eskorty, a blisko celu przechodzą do zwykłej walki. Podczas eskorty obowiązuje kontrola bezpiecznego ruchu. Po zakończeniu zadania steruje nimi zwykła AI.
- Rzeczywisty pivot kamery Pixi ma X/Y jako gettery. Kopiowanie przez spread gubiło współrzędne i blokowało wyszukiwanie wejść poza ekranem. Teraz współrzędne są kopiowane jawnie; osobny test używa ObservablePoint.

## Zapis i ponowienie

Opcjonalne pole `researchReturned` rozdziela trzy wykonane pomiary od bezpiecznego powrotu z danymi. Samo `researchSites === 3` nie kończy już misji. Walidacja dopuszcza czwartą falę oraz nowe komunikaty powrotu.

Przy nowej wyprawie wznawia się ostatni niedokończony etap. Po utracie Keplera w czasie powrotu trzeba ponownie wykonać trzeci skan i doprowadzić nowy statek do stacji. Fale niedokończonych etapów są resetowane; nie odtwarzają się od razu przy wczytaniu mapy. Już ukończone pomiary wcześniejszych etapów pozostają zaliczone. Stare zapisy z ukończonym zadaniem nie wymagają jego powtarzania.

## Weryfikacja

- 288/288 testów zestawu akceptacyjnego (`dist/research-acceptance.txt`), obejmującego poprzednie 276, pięć testów ogólnej eskorty i siedem testów ekspedycji Marsa. Nie jest to deklaracja zielonej całej historycznej regresji.
- Pełna symulacja: lot Keplera z rzeczywistą fizyką i skałami przez trzy stanowiska i z powrotem. Kontrola położenia Keplera i dronów po każdym kroku, 12 wejść poza ekranem, rzeczywiste zbliżenie dronów do eskorty, ostatni atak na powrocie oraz brak sukcesu przed dokiem. Gracz w teście podąża za eskortą, a drony są usuwane dopiero po fizycznym dolocie do zasięgu walki. To test przepływu i nawigacji, nie balansu walki.
- 48 kombinacji etapu, obrotu i powiększenia kamery potwierdza wejścia poza ekranem i poza niszczącym obszarem. Osobny test obejmuje prawdziwy typ punktu kamery Pixi.
- HUD po sukcesie wskazuje Satuk 15 i potwierdza powrót. Legacyjne kontrakty nie nadpisują już nawigacji tej ekspedycji. Osobny test sprawdza tekst i wybrany cel.
- Testy sprawdzają bezpieczne odcinki i trafianie wiązki w rzeczywistą granicę anomalii, animację i wygaszenie aktywnego skanowania, utratę danych podczas niedokończonego powrotu oraz zgodność wcześniej ukończonej misji.
- Przeglądarka: rzeczywiste Pixi Application, MissionWorld i MissionHud. Podgląd trzech stanowisk oraz cały przebieg przy 4× czasu symulacji, z kontrolowaną obroną i niezniszczalnymi statkami. Zakończenie po 194 s czasu symulacji: trzy pomiary, cztery fale, 12 fizycznych dolotów dronów i Kepler na `(171, 15)`, wewnątrz promienia dokowania 190. `researchReturned` i sukces zmieniły się dopiero przy stacji. Brak błędów lub ostrzeżeń konsoli. Szczyt sterty JS 285 MB, końcowy odczyt 156 MB; to nie pomiar całego procesu Chrome. Maksymalny zmierzony krok aktualizacji świata i HUD przy 4× czasu wyniósł 48 ms.
- Dowody: `validation-v0.136/kepler-scan.png`, `expedition-complete.txt`, `expedition-complete.png`.
- Kontrola typów, pełny lint i build produkcyjny przechodzą. Lokalny bundle deweloperski również przebudowano.

Powtarzalny podgląd, bez dostępu do zapisu gracza: po uruchomieniu serwera deweloperskiego `node scripts/qa-mars-research.mjs`, następnie `http://localhost:3002/qa-mars-research.html`. Przyciski pokazują kolejne skany, nalot i pełny przebieg z kontrolowaną obroną. Podgląd ma limit bezpieczeństwa 700 MB sterty JS.
