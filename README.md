# Orbit · Asteroids

Aktualna wersja **0.78** usuwa podkłady HUD i obrót paralaksy przy skręcaniu, zaokrągla asteroidy oraz panele przekaźników i usuwa dekoracyjne obrysy wypełnionych obiektów. Instruktor pomaga wydobywać prawdziwe skały, a księżycowy Muł pokazuje dwie wiązki z własnych laserów. Format kampanii **47**, dziennika **21** bez zmian. [Zakres i weryfikacja](docs/implementation-v0.78.md).

Wersja **0.77** rozpoczyna szeroki lifting oprawy w kierunku referencji Kurzgesagt: wspólna paleta, panele i HUD, jedenaście ilustracji sektorów, nowa Satuk 15, pastelowa flota oraz uproszczone asteroidy i powierzchnia Księżyca. Zachowuje sylwetki i ulepszenia statków. Format kampanii **47**, dziennika **21** bez zmian. [Zakres, weryfikacja i dalsza oprawa](docs/implementation-v0.77.md).

Wersja **0.76** wymienia efekty dźwiękowe na **22 próbki z nowych paczek**: broń, trafienia, eksplozje, zbieranie, interfejs i pętle maszyn. Dodaje sygnały hipernapędu i alarm skażenia, rezerwę głosów dla ważnych zdarzeń oraz przyciszanie maszyn podczas walki i alarmu. Nowe pliki zajmują około **240 KB**. Format kampanii **47**, dziennika **21** pozostaje aktualny. [Zakres i weryfikacja](docs/implementation-v0.76.md) · [Źródła dźwięków](docs/audio-credits.md).

Wersja **0.75** dodaje **odzysk sondy ze skażonej anomalii przy Jowiszu**. Po pierwszym zwiadzie wybierz dodatkowe zadanie w stacji. **3/4/5** wyznaczają bezpieczny objazd, **N** wskazuje sondę, **E przez 3 s** podłącza hol, a **J** go zwalnia. Fioletowe pasma zadają **10 obrażeń/s** po ostrzeżeniu. Fizyczna dostawa sondy do Satuk 15 daje jednorazową nagrodę i potwierdzenie radiowe. **Format kampanii 47, dziennika 21 — nowy zapis, bez migracji.** [Zakres i weryfikacja](docs/implementation-v0.75.md).

Wersja **0.74** rozszerza **potwierdzenia radiowe na akty II–X**: odczyty, patrole, obrony, oczyszczanie pasa, zniszczenie stoczni i bossowie są zapisywani podczas lotu. Częściowe patrole nie naliczają się ponownie przy dokowaniu; potwierdzone cele przetrwają stratę statku. Nowo odblokowane miejsca w tych aktach powstają przy kolejnym wylocie. Fizyczny ładunek nadal wymaga dostarczenia. **Format kampanii 46, dziennika 20 — nowy zapis, bez migracji.** [Zakres i weryfikacja](docs/implementation-v0.74.md).

Wersja **0.73** dodaje przy Ziemi **instruktora AI w drugim Prospectorze**. Prowadzi do aktualnego celu, objaśnia wydobycie, dostawy i łączność, omija skały i czeka po utracie kontaktu. **V** wskazuje jego pozycję. Zadania wykonujesz samodzielnie; utrata instruktora nie blokuje gry, a po potwierdzeniu dalszej trasy wraca on na podejście do stacji. [Zakres i weryfikacja](docs/implementation-v0.73.md).

Wersja **0.72** przenosi potwierdzenia radiowe na **Księżyc**: zwiad, odbiór techniczny, ratunek i finałowa obrona są zapisywane w locie. Zwiad otwiera powierzchnię i Muła w tej samej wyprawie. **C** działa przy Satuk 15 na orbicie oraz do **300 m** od budowy na powierzchni, poniżej **35 m/s**. Dostawy gracza i Muła dzielą postęp; materiały zabrane z magazynu nie dają XP za wydobycie. **Format kampanii 45, dziennika 20 — wymagany nowy zapis, bez migracji.** [Zakres i weryfikacja](docs/implementation-v0.72.md).

Wersja **0.71** wdraża nowy cykl przy Ziemi: odczyty automatycznie potwierdza Satuk 15 przez rozmowę radiową. **C**, do **650 m** od stacji i poniżej **35 m/s**, uruchamia animowany transfer ładunku bez dokowania. Ruda automatycznie zasila zaopatrzenie i rezerwę; nadmiar trafia do magazynu. Potwierdzone raporty i dostawy przetrwają utratę statku. Pozostałe akty zachowują dotychczasowe rozliczanie. **Format kampanii 44, dziennika 20 — wymagany nowy zapis, bez migracji.** [Zakres i weryfikacja](docs/implementation-v0.71.md).

Wersja **0.70** usuwa siatkę początkowego ziemskiego złoża i układa dalekie złoża w trzy nieregularne skupiska. Skały na dalszej orbicie powoli dryfują i reagują na zderzenia; przejezdność śluz uwzględnia zapas na ich ruch. Budżet dalekiego złoża pozostaje bez zmian: 12 bogatych skał, w tym 4 miedziowe. Format kampanii 43 i dziennika 20 pozostaje aktualny. [Zakres i weryfikacja](docs/implementation-v0.70.md).

Wersja **0.69** dodaje hipernapęd pod **spacją**, paliwo i tankowanie w **Stacja → Przemysł → Paliwo**. Po uruchomieniu ziemskiego zaplecza orbita powiększa się do promienia **5,5 km**, z trzema obszarami i dwiema trasami ze śluzami. **K** wskazuje najbliższą śluzę; poza nimi skok leci w kierunku kursora. Jedno ogniwo na skok, ponowna spacja anuluje ładowanie. Kolizja podczas przelotu niszczy statek; przed rozliczeniem straty działa animacja utraty sygnału. **Format kampanii 43, dziennika 20 — wymagany nowy zapis, bez migracji.** [Zakres i weryfikacja](docs/implementation-v0.69.md).

Wersja **0.68** łączy wydobycie na Merkurym, nowy przemysł i rozbudowę stacji. Po zwiadzie **6** wskazuje spiek merkuriański: tylko szczęki Harpuna mogą go wyrwać. W **Stacja → Przemysł → Przemysł kinetyczny** powstają płyty i moduły osłonowe. Dwa poziomy tarczy zwiększają ochronę **850 → 1000 → 1150 m**, a dwa wzmocnione segmenty magazynu dają po **+400 miejsca**. Nowe zadanie dodatkowe prowadzi przez cały łańcuch. **Format kampanii 42, dziennika 20 — wymagany nowy zapis, bez migracji.** [Zakres i weryfikacja](docs/implementation-v0.68.md).

Wersja **0.67** zastępuje przytrzymywanie przy terminalach dwiema minigrami: **E** otwiera obwód włamania, **G** przekierowanie zasilania skanera za jeden komponent. Świat działa podczas pracy; trafienie i utrata połączenia przerywają próbę. Sokół ma 45 s zamiast 30 s i połowę śladu po błędzie. Feniks może natychmiast pobrać dane kosztem alarmu i pościgu. Dotyczy kampanii oraz trybu testowego. [Zakres i weryfikacja](docs/implementation-v0.67.md).

Wersja **0.66** rozbudowuje obrony placówek: Księżyc i Wenus po sześciu napastników, Mars dziewięciu, w trzech mieszanych falach. Jednostki dolatują spoza bieżącego widoku kamery, bez wskaźnika kierunku nadejścia. Rozpoznane kontakty na radarze i zapowiedzi broni pozostają widoczne. Format kampanii 41 i dziennika 19 bez zmian. [Zakres i weryfikacja](docs/implementation-v0.66.md).

Wersja **0.65** dodaje **cztery role przeciwników**: przechwytującego, ciężkiego Pancernika, naprawczego Serwisanta i stawiacza min. Mieszane składy pojawiają się w stoczni marsjańskiej; wszystkie cztery role można od razu sprawdzić przez **Sandbox / testy → Oddział mieszany**. Różne sylwetki, wiązki naprawcze, zapowiedź salwy i uzbrajanie min pokazują działania przeciwnika. Format kampanii pozostaje 41, dziennika 19: zapis 0.64 nadal działa. [Zakres i weryfikacja](docs/implementation-v0.65.md).

Wersja **0.64** dodaje **drony strażnicze Satuk 15**. Budowany hangar zapewnia trzy sojusznicze jednostki patrolujące stację na orbicie, wykrywające i ostrzeliwujące lokalnych przeciwników. Uszkodzone wracają na naprawę; zniszczone wymagają materiałów i czasu odbudowy. Dostęp: **Stacja → Przemysł → Ochrona Satuk 15 → Drony strażnicze**. Format kampanii 41 wymaga nowego zapisu. [Zakres i weryfikacja](docs/implementation-v0.64.md).

Wersja **0.63** dodaje **stocznię polową przeciwnika przy Marsie**. Opcjonalny rozkaz Zatrzymaj produkcję prowadzi do bazy regularnie wypuszczającej drony i Lancery. Zniszczenie rdzenia zatrzymuje starty, a bezpieczny powrót utrwala wyłączenie stoczni. [Zakres i weryfikacja](docs/implementation-v0.63.md).

Wersja **0.62** dodaje **animowane przejścia między orbitą a powierzchnią Księżyca**: wygaszenie podejścia, księżycowy horyzont i zbliżenie kamery. Krótki transfer blokuje sterowanie i wstrzymuje symulację, zachowując ładunek i hol. [Zakres i weryfikacja](docs/implementation-v0.62.md).

Wersja **0.61** przenosi Muła na **budowę stacji na Księżycu**. Eskortowany transport wydobywa surowce, wozi kolejne ładunki do placówki i naprawia się z własnych zasobów. Gracz może równolegle dostarczać rudę. Fundamenty wymagają 160 Fe i odblokowują kadłub Muła. Wymagany nowy zapis. [Zakres i weryfikacja](docs/implementation-v0.61.md).

Wersja **0.60** powiększa powierzchnię Księżyca i dodaje odległy **grzbiet miedziowy**. Klawisz **5** na powierzchni prowadzi do opcjonalnego wydobycia Cu z przytwierdzonych do podłoża formacji skalnych. [Zakres i weryfikacja](docs/implementation-v0.60.md).

Wersja **0.59** dodaje **misję ratunkową przy Księżycu**. Po rozpoznaniu trasy można podjąć Sygnał ratunkowy: zabezpieczyć trzy obwody uszkodzonego promu, podłączyć fizyczny hol i odprowadzić cel do Satuk 15. Patrol, uszkodzenia, odłączenie holu i możliwość ponowienia uzupełniają zadanie. Wymagany jest nowy zapis. [Zakres i weryfikacja](docs/implementation-v0.59.md).

Wersja **0.58** dodaje **eskortę wydobywczą Muła** jako dodatkową misję po uruchomieniu ziemskiego zaplecza. Transport AI omija skały, czeka na gracza, wydobywa i zbiera 12 Fe, a następnie wraca do Satuk 15. Gracz odpiera zasadzkę i dostarcza raport. N wskazuje Muła, E rozpoczyna eskortę. Wymagany jest nowy zapis. [Zakres i weryfikacja](docs/implementation-v0.58.md).

Wersja **0.57** dodaje **minigrę łączności orbitalnej przy Ziemi**. Po naciśnięciu E przy przekaźniku dopasowujesz fazy trzech kanałów i zatwierdzasz synchronizację. Świat nadal działa, trafienie lub utrata zasięgu przerywają próbę, a raport zalicza dopiero bezpieczny powrót. [Zakres i weryfikacja](docs/implementation-v0.57.md).

Wersja **0.56** dodaje **generator tarczy Satuk 15**. Po ukończeniu zaplecza ziemskiego można zamontować go za 30 Fe, 6 komponentów i 3 moduły zasilania. Rozszerza ochronę doku z 260 do 850 m, odpycha asteroidy i wrogów oraz zatrzymuje pociski. Dostęp: **Stacja → Przemysł → Tarcza Satuk 15**. Wymagany jest nowy format zapisu. [Zakres i weryfikacja](docs/implementation-v0.56.md).

Wersja **0.55** dodaje **przemysł Satuk 15**: wydobycie miedzi, przewodniki, moduły zasilania i konstrukcje segmentów magazynowych. Panel **Stacja → Przemysł** obsługuje produkcję oraz montaż trzech segmentów po +200 miejsca. Produkcja postępuje podczas lotu. Wymagany jest nowy zapis. [Zakres i weryfikacja](docs/implementation-v0.55.md).

Wersja **0.54** dodaje **odblokowania kadłubów i wybór misji przed startem**. Początkowo dostępne są Prospector i Swift. Zwiad, patrol lub boss mogą być celem wyprawy: dokowanie otwiera się po wykonaniu celu, a TAB pozwala zarządzić odwrót bez raportu, nagrody i ładunku. Swobodny lot pozostaje dostępny. **Starsze formaty zapisów są nieobsługiwane — wymagany jest nowy start.** [Zakres i weryfikacja](docs/implementation-v0.54.md).

Wersja **0.53** rozpoczyna rozbudowę zawartości: **trzy odprawy przy Ziemi z portretami i ręcznym przechodzeniem kwestii** oraz **stopniowe ujawnianie zadań** w dzienniku, HUD i TAB. Przyszłe cele pozostają ukryte; dostępne równoległe i dodatkowe zadania zachowują swobodę kolejności. Ukończone dialogi są zapisywane i można je powtórzyć bez nagród. [Zakres i weryfikacja](docs/implementation-v0.53.md).

Wersja **0.52** dodaje **Plutona i mechaniczny finał aktu X**: zwiad, równoległe dane bazy i osłonę podejścia, trzy fazy finałowego starcia oraz trwały raport po bezpiecznym powrocie. Po ukończeniu celów wcześniejsze sektory pozostają dostępne. Treść zakończenia i prawda o anomalii pozostają otwarte. [Zakres i weryfikacja](docs/implementation-v0.52.md).

Wersja **0.51** dodaje **Urana, Neptuna i pierwsze starcie — mechaniczny zakres aktu IX**. Rozpoznaj bazy, przechwyć dane i zabezpiecz trasę między sektorami. Przy Neptunie G w oznaczonym rejonie rozpoczyna dwufazową walkę z ciężką jednostką: zmuszasz ją do odwrotu i wracasz z raportem. Próby można ponawiać, a bezpieczne powroty zachowują postęp oraz jednorazowe nagrody. Tożsamość przeciwnika i ujawnienia fabularne pozostają otwarte. [Zakres i weryfikacja](docs/implementation-v0.51.md) · [Aktualny plan](docs/plan-current.md).

Wersja **0.50** dodaje **Saturna — mechaniczny zakres aktu VIII**. Rozpoznaj pierścienie, przywieź 36 rudy w dowolnej liczbie wypraw i zabezpiecz odległy patrol. Zaopatrzenie liczy ładunek z bezpiecznych powrotów; ruda pozostaje zwykłym zasobem magazynu. Oba cele otwierają dalszy punkt z odczytem trasy. Opcjonalne złoże kryształów i projekt rezerwy pozostają dostępne. [Zakres i weryfikacja](docs/implementation-v0.50.md) · [Aktualny plan](docs/plan-current.md).

Wersja **0.49** otwiera **Jowisza — operacyjny zakres aktu VII**. Po przejściu pasa wykonaj zwiad, zabezpiecz rejon i przechwyć dane z chronionego węzła. Skaner, alarm, obrońcy i sabotaż działają podczas zwykłego lotu. Raporty walk i włamania otwierają dalszy punkt z pakietem obserwacyjnym. Treść kluczowego ujawnienia fabularnego pozostaje do ustalenia przez autora. [Zakres i weryfikacja](docs/implementation-v0.49.md) · [Aktualny plan](docs/plan-current.md).

Wersja **0.48** dodaje **grywalne przejście pasa asteroid — akt VI**. Po technologii Merkurego i zabezpieczeniu Marsa wybierz sektor Pas. Zwiad wejścia otwiera dalszy obszar: usuń trzy oznaczone skały w dowolnej kolejności, wracaj z raportami i dotrzyj do zewnętrznej granicy. Ruchome odłamki i opcjonalne patrole urozmaicają przelot. Każda potwierdzona przeszkoda znika trwale z kolejnych wypraw. [Zakres i weryfikacja](docs/implementation-v0.48.md) · [Aktualny plan](docs/plan-current.md).

Wersja **0.47** dodaje **bazę marsjańską i mechaniczny ciąg aktu V**. Po powrocie z technologią Merkurego przygotuj 40 rudy i 10 komponentów, zmontuj bazę przez E i wykonaj dwa równoległe cele bojowe: obronę obiektu oraz zabezpieczenie korytarza. Raporty wymagają bezpiecznego powrotu, a wcześniejszy dziennik Marsa pozostaje zachowany. [Zakres i weryfikacja](docs/implementation-v0.47.md) · [Aktualny plan](docs/plan-current.md).

Wersja **0.46** dodała **Merkurego i mechaniczny ciąg aktu IV**: temperaturę, cykliczne rozbłyski, chłodzenie w cieniu rzeczywistych asteroid oraz wyprawę po pakiet technologii przejścia pasa. Osłona przygotowana przy Wenus ogranicza nagrzewanie. Pomiary, walka i odzyskanie danych wymagają bezpiecznych powrotów. [Zakres i weryfikacja](docs/implementation-v0.46.md) · [Aktualny plan](docs/plan-current.md).

Wersja **0.45** dodała **budowę placówki przy Wenus, projekt osłony słonecznej i obronę przed AI**. Po wcześniejszych pomiarach i zgromadzeniu 32 rudy przytrzymaj E przy obiekcie wskazywanym przez 8. Następnie przekaż w stacji 12 komponentów na osłonę oraz odeprzyj atak rozpoczynany przez G przy placówce. Bezpieczny powrót z raportem i gotowa osłona mechanicznie zamykają akt III. [Zakres i weryfikacja](docs/implementation-v0.45.md) · [Aktualny plan](docs/plan-current.md).

Wersja **0.44** dodała **odprawę po powrocie na Ziemię i trasę do Wenus**. Zatwierdzenie planu po rozpoznaniu pasa mechanicznie kończy akt II. Początek aktu III obejmuje zwiad Wenus, pomiary miejsca pod placówkę i gromadzenie materiałów. [Zakres i weryfikacja](docs/implementation-v0.44.md) · [Aktualny plan](docs/plan-current.md).

Wersja **0.43** rozpoczęła **akt II przy Marsie**: równoległy zwiad i walka z patrolami, otwarcie dalszego obszaru oraz odczyt blokady pasa asteroid. Raporty wymagają bezpiecznego powrotu. Ziemia i Księżyc pozostają dostępne, a zapis zachowuje postęp aktu I. [Zakres i weryfikacja](docs/implementation-v0.43.md) · [Aktualny plan](docs/plan-current.md).

Wersja **0.42** dodała **finałową obronę stacji księżycowej i mechaniczne zakończenie aktu I**. Po wcześniejszych zadaniach G przy stacji uruchamia trzy kontakty AI. Broń stacji i wróć z raportem do Satuk 15, aby zamknąć akt oraz odebrać jednorazową nagrodę. Tożsamość przeciwnika i wyjaśnienie anomalii pozostają otwarte. [Zakres, zapis i weryfikacja](docs/implementation-v0.42.md) · [Aktualny plan](docs/plan-current.md).

Wersja **0.41** dodała obronę budowy przed trzema falami asteroid, stan konstrukcji i ponowienie bez cofania dostaw. [Zakres](docs/implementation-v0.41.md).

Wersja **0.40** dodała lot nad powierzchnią Księżyca i budowę stacji paliw: **48 rudy → 12 komponentów → odbiór techniczny**. Dostawy pozostają zapisane między lotami, a **Wylot z dostawą** zabiera materiały z magazynu. [Zakres](docs/implementation-v0.40.md).

Wersja **0.39** rozpoczęła kampanię **Satuk 15**: trwałe sektory, równoległe zadania, stopniowe otwieranie orbity Ziemi i trasa księżycowa. Kampania ma osobny zapis; **Stary zapis testowy** zachowuje dostęp do wcześniejszej gry, a sandbox pozostaje dostępny w obu profilach. [Zakres](docs/implementation-v0.39.md).

Projekt kampanii: [Satuk 15 — 10 aktów w Układzie Słonecznym](docs/campaign-outline.md). Akt I ma przechodni ciąg mechanik wraz z finałowym atakiem i podsumowaniem. Akt II łączy podejście do Marsa, rozpoznanie blokady i odprawę ziemską; akt III obejmuje przygotowanie i obronę placówki Wenus, IV wyprawę na Merkurego, V powrót i bazę marsjańską, VI przejście pasa asteroid, VII ma już zwiad, walki i przechwycenie danych przy Jowiszu, VIII eksplorację i zaopatrzenie przy Saturnie, IX bazy oraz pierwsze starcie przy Uranie i Neptunie, a X przygotowanie i finałową walkę przy Plutonie. Oprawa fabularna, tempo i balans całej kampanii pozostają do rozwinięcia. Prawda o anomalii i zwroty fabularne nadal czekają na ustalenia autora.

Wersja **0.38** domknęła techniczny audyt fundamentów: zwalnianie kontekstów grafiki, pomiary FPS/pamięci i licznik osłon Aegisa. Wykonano 224 próby porównawcze oraz przejście ekonomii do warsztatu II. [Wyniki i ograniczenia](docs/implementation-v0.38.md).

Wersja **0.37** dodaje osobny tryb **Sandbox / testy**: sześć scenariuszy, wybór statku i modułów, seed, szybki restart oraz lokalne raporty. Próby nie zmieniają zapisu kampanii. [Zakres](docs/implementation-v0.37.md).

Wersja **0.36** dodała indywidualny podgląd modułów 0–III i porównanie parametrów przed zakupem. [Zakres](docs/implementation-v0.36.md).

Wersja **0.35** porządkuje parametry statków, dodaje podgląd modułów w stoczni, dopasowuje wygląd ulepszeń do kadłubów oraz poprawia ostrza i dash Widma. [Zakres i weryfikacja](docs/implementation-v0.35.md).

Wersja **0.34** rozdziela Swifta i Widmo, dodaje fazowy dash, pasywne zakłócanie radarów, odbudowę wrogich wraków i modernizacje rezerw oraz warianty uzbrojenia dla całej floty. Załoga pozostaje w bazie; Mule zachowuje produkcję zestawów w locie. Ulepszenia pasują do geometrii kadłubów, a grubsze ściany Aegis blokują długie lufy. [Zasady, migracja i testy](docs/implementation-v0.34.md).

Aktualny backlog: [plan rozwoju](docs/plan-current.md). Po wersji 0.33 przeprowadzono [stabilizację techniczną](docs/stabilization-v0.33.md): synchronizację zestawów naprawczych, poprawki złomowania oraz długie testy symulacji. Poniższe opisy wersji stanowią historię wdrożeń.

Wersja **0.33** dodaje **intendenta pokładowego**. Zatrudnionego Niko Rella można przydzielić do stacji lub na pokład. Gdy brakuje zestawu, po 30 s przygotuje jeden za 8 komponentów z ładowni; pobranie następuje dopiero po zakończeniu pracy. Intendent uzupełnia zapas dla mechanika, nie prowadząc równocześnie recyklingu w bazie. Gotowe zestawy wracają z udaną wyprawą, limit zapasów pozostaje równy 10, a strata statku oznacza stratę pokładowej załogi. Panel TAB pokazuje stan produkcji. Mule zachowuje natychmiastową produkcję na PPM. Zapis 17 zachowuje przydział mechanika i pozostawia starszego intendenta w stacji. [Zasady i weryfikacja](docs/implementation-v0.33.md).

Wersja **0.32** dodaje pierwszą **załogę pokładową**. W panelu Załoga przydzielasz zatrudnioną mechanik Adę Vale do stacji lub na pokład. Podczas lotu automatycznie naprawia awarię napędu albo kadłub poniżej 60%: 8 s pracy i jeden zestaw przywracają napęd oraz 25 HP, bez przerywania pilotażu i ostrzału. Na pokładzie nie prowadzi produkcji w bazie; utrata statku oznacza również jej stratę. Panel TAB pokazuje zadanie i zapas zestawów. Zapis 16 migruje wcześniejsze kampanie bez przydzielania załogi automatycznie. [Zasady i weryfikacja](docs/implementation-v0.32.md).

Wersja **0.31** dodaje **Feniksa**, uniwersalny szturmowiec według referencji: **LPM** obsługuje jeden długi czerwony laser bojowy na środku dziobu, zadający 30 HP/s i nakładający podpalenie 8 HP/s przez 3 s. Ta sama wiązka wydobywa surowce. **PPM** odpala rakietę Atlasa z namierzaniem kursorem przez 3 s. Dwa krótkie chwytaki, ładownia 55, kadłub 95 i tarcza 55. Cena 190 rudy / 18 komponentów wymaga warsztatu II. Stocznia ma jedenaście typów; limit floty nadal wynosi sześć. [Parametry i weryfikacja](docs/implementation-v0.31.md).

Wersja **0.30** dodaje **Żądło**, szybki **glass cannon** z szerokimi rozwidlonymi skrzydłami i czterema działkami: po dwa na każdym skrzydle, bez broni na dziobie. **LPM** wystrzeliwuje salwę skuteczną przeciw lekkim patrolom, **PPM** salwę przeciwpancerną skuteczną przeciw Lancerom. Bez lasera i kamuflażu; jeden chwytak i dwa silniki. Prędkość 680, skręt 2,85 i boost ×1,95 kosztem 55 HP, tarczy 20 i ładowni 20. Zakup za 165 rudy / 14 komponentów wymaga warsztatu II. Stocznia ma dziesięć typów, limit floty nadal wynosi sześć. [Parametry i weryfikacja](docs/implementation-v0.30.md).

Wersja **0.29** rozwija specjalizacje floty: **Widmo** zastępuje Swifta nową sylwetką i kamuflażem optycznym na **PPM** przez **3 s**, z bazowym odnowieniem **12 s**. **Mule** wydobywa na **LPM**, a na **PPM** tworzy zestaw naprawczy za **12 rudy / 2 komponenty z ładowni**, wyłącznie przy zapasie zestawów równym zero; po zużyciu może tworzyć następne. **Manta** holuje dwie jednostki, **Bastion** otrzymuje granaty zamiast lasera, a **Aegis** ma jeden chwytak. Prospector i Manta mają działko z lewej i laser z prawej strony dziobu. Lasery zadają także niewielkie obrażenia wrogim statkom. [Parametry i weryfikacja](docs/implementation-v0.29.md).

Wersja **0.28** dodaje **Aegisa**: **LPM** strzela długimi pociskami energetycznymi wyłączającymi broń wroga na 2,5 s, **PPM** natychmiast odnawia tarczę matki i osłania pobliskich sojuszników przez 6 s. Mini dron krąży przy statku i reaguje tylko na walkę matki; po zniszczeniu **R** i jeden zestaw naprawczy odbudowują pomocnika. Ogniwo, dron i impuls mają własne ulepszenia. Cena 210 rudy / 22 komponenty, warsztat II. [Parametry i weryfikacja](docs/implementation-v0.28.md).

Wersja **0.27** dodaje dwa kadłuby według referencji: **Atlas**, grenadier z rakietami na **LPM**, granatami na **PPM**, czterema kontenerami i ładownią 150, oraz **Harpun** z przegubowymi ramionami i dwukrotnie szybszym podejmowaniem holu. Atlas namierza wroga po 3 s trzymania kursora; jego rakiety i granaty zadają obrażenia obszarowe, a ulepszenie granatów zwiększa salwę w stożku. Harpun zaciska szczęki na **LPM**, a przytrzymanie **PPM** wysuwa ramiona ku celowi. Oba kadłuby mają cztery długie chwytaki oraz własne ulepszenia broni, bez działek i laserów. Wymagają warsztatu II. Stocznia ma dwie strony katalogu; limit posiadanej floty pozostaje równy sześć. [Parametry i weryfikacja](docs/implementation-v0.27.md).

Wersja **0.26** dodaje tarcze kinetyczne statków: absorpcję obrażeń przed kadłubem, regenerację po przerwie, szybkie ładowanie w doku Aurory oraz trzy poziomy ulepszeń. Niebieski pierścień heksów i HUD pokazują naładowanie. Promieniowanie poza sektorem omija tarczę. [Szczegóły etapu](docs/implementation-v0.26.md).

Wersja **0.25** dodaje kontrakt **Eskorta Keplera**: przyjazny statek AI omija skały, czeka na gracza i bada anomalię. **N** wskazuje statek, **E** rozpoczyna misję. Chroń Keplera przed zasadzką i ostrzałem, a po badaniach wróć z danymi po premię 36 rudy / 8 komponentów. Format zapisu 14 zachowuje wcześniejsze kontrakty i dostawy holu. [Szczegóły etapu](docs/implementation-v0.25.md).

Wersja **0.24** dodaje wraki przeciwników i fizyczne holowanie. **Z** wskazuje wrak, **E** podejmuje, **J** zwalnia. Przekazanie holu do doku Aurory daje recykling/odzysk i **nie kończy wyprawy**; zwykłe dokowanie E również rozlicza hol. Można dostarczyć kilka obiektów, zachowanych po późniejszej śmierci i widocznych w podsumowaniu. Wraki i kapsuły mogą zostać zniszczone przez skały lub ostrzał wroga; gracz nie ma z nimi kolizji ani friendly fire. [Szczegóły etapu](docs/implementation-v0.24.md).

Wersja **0.23** dodaje twierdzę **Aegis**: fizyczne ściany, otwartą bramę, pięciu obrońców i rdzeń z danymi. Kontrakt **Przełamanie Aegis** płaci 48 rudy / 12 komponentów po bezpiecznym powrocie. **H** wskazuje twierdzę; HUD pokazuje postęp obstawy. Zapis migruje do formatu 13. [Szczegóły etapu](docs/implementation-v0.23.md).

Wersja **0.22** rozszerza promień sektora do 8000: gniazdo kryształów za trzema pierścieniami skał, szybki prąd Perseid, podtrzymany dryf Heliosa i trzy wędrujące patrole. **T** przełącza nawigację między nowymi obszarami. [Szczegóły etapu](docs/implementation-v0.22.md).

Wersja **0.21** dodaje trzeci surowiec: **kryształy technologiczne**. Wydobywasz je z rzadkich skał z fioletowymi minerałami albo zlecasz mechanikowi przetop **5 komponentów → 1 kryształ / 90 s**, wymagający warsztatu I. Kryształy są potrzebne przy modułach statku II/III, warsztacie II i magazynie II/III. Ładownie, chwytaki, produkcja, magazyn i rozliczenie obsługują nowy surowiec. Zapis migruje do formatu 12. [Balans i weryfikacja](docs/implementation-v0.21.md).

Wersja **0.20** dodaje ludzkie portrety bez rysów twarzy, większą pulę nazw pilotów, zanikający ślad podróży i strefy patroli na radarze, płynny zoom przy dużej prędkości oraz odświeżoną kapsułę ratunkową. [Szczegóły](docs/implementation-v0.20.md). Pozostałe nowe propozycje — trzeci surowiec, przetapianie, mocniejsze ulepszenia, większy świat, dryfujące klastry, patrole, strzeżone sekcje i wraki bojowe — są ujęte w [kolejnych etapach](docs/roadmap-after-v0.19.md).

Wersja **0.19** dodaje kradzież sprzętu z Cerbera. Po pobraniu danych puść E i przytrzymaj ponownie przez 5 s: zabierzesz Impuls lub Kinetic, zajmujące 3 miejsca w ładowni. Dopiero bezpieczne dokowanie dodaje broń do wyposażenia aktywnego statku; duplikat jest rozbierany na materiały. Sabotaż pomaga otworzyć okno na kradzież, a alarm i trafienia przerywają działanie. [Szczegóły i weryfikacja](docs/implementation-v0.19.md).

Wersja **0.18** dodaje 18 dźwięków z dostarczonych paczek CC0: osobne próbki broni, eksplozje, trafienia, tarczę, łup, ciche pętle silnika/lasera/spawania oraz sygnały interfejsu. Miks uwzględnia odległość i siłę zdarzeń, ogranicza nakładanie próbek oraz zatrzymuje pętle w menu i po utracie fokusu. Działa z istniejącym suwakiem efektów. [Szczegóły](docs/implementation-v0.18.md) · [Źródła CC0](docs/audio-credits.md).

Wersja **0.17** dodaje wymienne uzbrojenie w **Hangar → Uzbrojenie**. Autocannon zachowuje obecny balans, Impuls daje szybszą serię na krótszym dystansie, a Kinetic mocny, rzadszy strzał z daleka. Dwie nowe bronie wymagają warsztatu I. Zakup przypisuje broń do aktywnego kadłuba; przełączanie posiadanych działek jest darmowe w bazie. Broń pozostaje na odzyskanym wraku i wlicza się do złomowania; laser nadal odpowiada za wydobycie. Format zapisu 11 migruje stare statki bez utraty postępu. Parametry i weryfikacja: [docs/implementation-v0.17.md](docs/implementation-v0.17.md).

Wersja **0.16** odświeża elementy rozgrywki: drony, Aurorę, Cerbera, skrytki, wrak oraz obiekty badawcze. Metaliczne poszycie, szkło i stonowane materiały pasują do floty gracza. Asteroidy mają 128 wariantów z różnymi konturami, kraterami i żyłami minerałów. Zniszczenia emitują odłamki i pył, trafienia i zderzenia iskry od punktu kontaktu zależnie od obrażeń, a naprawa pokazuje spawanie w różnych miejscach kadłuba. Niebieska tarcza Aurory o promieniu 850 chroni przed dronami, asteroidami i pociskami obu stron; statek gracza i łup mogą swobodnie ją przekraczać. Galeria oraz weryfikacja: [docs/implementation-v0.16.md](docs/implementation-v0.16.md).

Wersja **0.15** dodaje sabotaż skanera Cerbera. Przy terminalu przytrzymaj **G** przez 3 s: jeden komponent z ładowni wyłączy skaner na 20 s i skasuje alarm. Możesz potem przejąć dane pod E albo uciec; wezwane drony pozostają aktywne. Sabotaż działa raz na wyprawę. Szczegóły: [docs/implementation-v0.15.md](docs/implementation-v0.15.md).

Wersja **0.14** dodaje **Lancera**, ciężkiego strażnika obserwatorium: 90 HP, wolniejszy lot, utrzymywanie dystansu i pocisk za 18 HP po dłuższym ładowaniu. Widać go po szerokiej sylwetce, długiej lufie, większym pocisku i rombie na radarze; F pokazuje nazwę. Zastępuje jednego strażnika bez zwiększania liczby patroli. Pozostawia 4 rudy oraz 4 komponenty. Szczegóły: [docs/implementation-v0.14.md](docs/implementation-v0.14.md).

Wersja **0.13** rozwija załogę bazy: **intendent Niko Rell** odzyskuje 5 rudy z 1 komponentu w 60 s lotu. Zatrudnienie wymaga warsztatu I oraz 20 rudy / 2 komponentów. Mechanik i intendent mają niezależne kolejki po trzy zadania i pracują równolegle. Zakładka Załoga pokazuje wybrane stanowisko; Tab pokazuje oba bieżące zadania. Gotowe produkty mają zarezerwowane miejsce w magazynie. Szczegóły: [docs/implementation-v0.13.md](docs/implementation-v0.13.md).

Wersja **0.12** dodaje kontrakt bojowy **Ochrona szlaku**: zniszcz trzy drony i wróć do bazy po 24 rudy oraz 6 komponentów. Odblokowanie wymaga udanego powrotu i warsztatu I. **F** wskazuje najbliższego drona, śledzi go podczas lotu i wybiera kolejnego po jego zniszczeniu. HUD pokazuje licznik celu oraz konieczność powrotu. Pilot zdobywa 2 PD za drona (maksymalnie 10 na wyprawę), wyłącznie po bezpiecznym dokowaniu. Szczegóły: [docs/implementation-v0.12.md](docs/implementation-v0.12.md).

Wersja **0.11** dodaje infiltrację placówki Cerber. **0** wskazuje jej terminal. Omijaj obrotową wiązkę skanera albo wykorzystaj kamuflaż pod **C**, a przy terminalu spokojnie przytrzymaj **E** przez 4 s. Pełne wykrycie blokuje terminal na 8 s i wzywa dwa drony. Przechwyt zapewnia dane oraz skrzynie z 6 komponentami i 4 jednostkami rudy, zbierane zwykłymi chwytakami. Kontrakt **Cichy przechwyt** odblokowuje Nasłuch sektora i warsztat I; premia 32 rudy / 8 komponentów wymaga bezpiecznego powrotu. Szczegóły: [docs/implementation-v0.11.md](docs/implementation-v0.11.md).

Wersja **0.10** dodaje dwie proceduralne skrytki z wyborem jednego z trzech prototypów. Klawisz **9** wskazuje najbliższą nieotwartą skrytkę; spokojne przytrzymanie **E** przez 2,5 s otwiera ekran wyboru i zatrzymuje wyprawę oraz pracę załogi. Siedem prototypów wzmacnia napęd, manewrowanie, laser, działka, ładownię, chwytaki lub kadłub. Premie działają tylko do końca wyprawy i nie zostają na odzyskanym wraku. Łup zachowujesz po bezpiecznym dokowaniu.

Widok lotu ma minimalny HUD: mały radar, paski kadłuba i ładunku z ikonami, cele ze znacznikami wykonania i krótkie podpowiedzi. **Tab** otwiera panel pokładu ze szczegółami statku, pilotem, prototypami i kolejką załogi. Menu pauzuje lot i pracę w bazie; zamyka się Tabem, Esc lub przyciskiem. Szczegóły: [docs/mission-interface.md](docs/mission-interface.md).

Lobby ma stałą nawigację po lewej i sześć odrębnych widoków kontekstowych. Środkowy podgląd zmienia się wraz z zakładką, a prawy panel pokazuje tylko wybrany kontrakt, statek, moduł stacji, pilota, kolejkę lub sygnał. Start wyprawy jest dostępny w Wyprawie i Ratunku. Projekt i galeria: [docs/lobby-interface.md](docs/lobby-interface.md).

Wersja **0.9** dodaje sześć kadłubów według konceptów użytkownika: Prospector I, Swift, Mule, Bastion, Manta i Sokół. Skręt jest słabszy i zależy od kadłuba, pilota oraz kupowanych dysz manewrowych; kamera podąża łagodniej. Statki różnią się również liczbą i pozycją silników, działek, laserów i chwytaków, zasięgami, ładownią, boostem oraz kamuflażem. Hangar mieści sześć statków i ma paginację oraz galerię sylwetek.

Prototyp gry 2D w PixiJS 8 i TypeScript, oparty na istniejącym boilerze. Zręcznościowy lot z fizyką Rapier 2D, wydobywanie rudy i komponentów, proceduralne sektory, baza, ulepszenia oraz piloci.

Sylwetki floty mają wygładzone kontury, panele poszycia, jasnoniebieskie szklane wizjery z okrągłymi refleksami, stonowane kolory materiałów i trapezowe silniki. Każdy model ma własny odcień kadłuba. Mule ma kształt T, Manta zbiorniki pod skrzydłami, a Widmo smukły korpus i zakrzywione skrzydła z turkusowymi akcentami. Prospector i Manta mają przednie mocowania: działko po lewej, laser po prawej. Galeria i historia zmian: [docs/ship-visuals.md](docs/ship-visuals.md).

Wersja 0.2 dodaje mechanika stacji, kolejkę produkcji i naprawę uszkodzonego napędu podczas wyprawy.

Wersja 0.3 dodaje flotę do trzech statków, zakup kadłubów Swift i Mule, osobne moduły każdego statku oraz złomowanie rezerwy. Aktualne sterowanie bazowego Prospectora pozostaje bez zmian.

Wersja 0.4 dodaje ratunek pilotów i odzysk utraconych statków z wyposażeniem. Zakładka **Ratunek** pozwala wrócić do sektora straty, podjąć kapsułę lub wrak i dowieźć cel do Aurory.

Wersja 0.5 dodaje przekaźnik Lumen i obserwatorium Mnemos, skanowanie danych oraz dwa kontrakty eksploracyjne. Pierwszy odblokowuje się po udanym powrocie, drugi po wykonaniu Nasłuchu sektora i zbudowaniu warsztatu I. Kampania zapisuje liczbę wykonań każdego kontraktu.

Wersja 0.6 dodaje doświadczenie i rozwój pilotów: pięć poziomów oraz wybór premii do manewrowania, wydobycia lub procedur ewakuacji. Awans daje punkt do przydzielenia w bazie. Początkujący piloci zachowują dotychczasowe sterowanie.

Wersja 0.7 wprowadza wrogów AI: pięć dronów patrolujących wrak, bogatą żyłę i obserwatorium. Wykrywają statek, ścigają go, celują z wyprzedzeniem i strzelają po widocznym ładowaniu działka. Zniszczony dron pozostawia 3 rudy i 2 komponenty. Początkowe pole wydobywcze i przekaźnik pozostają bez patroli.

Wersja 0.8 zmienia sterowanie na WASD, oddziela celowanie działek od kadłuba, dodaje laser wydobywczy pod PPM i boost pod Shift. Kamera obraca świat z lekkim opóźnieniem, utrzymując nos statku przy górze ekranu. Holowany wrak lub kapsuła dryfuje na luźnej linie.

Lot pozostaje arcade: statek osiąga prędkość przelotową w około pół sekundy, koryguje kierunek ruchu podczas skrętu i wyhamowuje po puszczeniu W w około 2–2,5 s, zachowując wyraźny dryf. Skręt narasta łagodniej, a po puszczeniu A/D statek jeszcze przez chwilę obraca się siłą bezwładności. Kamera podąża za obrotem z większym opóźnieniem. S najpierw stopniowo hamuje, a następnie uruchamia wsteczny. Zderzenia nadal obsługuje fizyka. Uszkodzony napęd ogranicza także prędkość maksymalną.

## Uruchomienie

```sh
npm install
npm start
```

Gra: http://localhost:3000. Tryb developerski przebudowuje kod i odświeża stronę. Odświeżenie podczas aktywnej wyprawy oznacza jej utratę, także w tym trybie.

```sh
npm run build-run
```

Buduje i uruchamia wersję produkcyjną, bez automatycznego odświeżania. Sam build: `npm run build`.

## Sterowanie

| Wejście                                | Działanie                                                                                                                          |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| W                                      | Przyspieszanie w kierunku kadłuba; po puszczeniu automatyczne hamowanie                                                            |
| A / D                                  | Skręt kadłuba w lewo / prawo                                                                                                       |
| S                                      | Hamowanie, potem lot wsteczny; ma pierwszeństwo przed W                                                                            |
| Shift + W                              | Boost zależny od kadłuba: prędkość ×1,25–2,10, przyspieszenie ×1,4                                                                 |
| Mysz                                   | Celowanie niezależnie od kierunku lotu                                                                                             |
| Przytrzymany LPM                       | Obracane działka na mocowaniach kadłuba; bardzo słabe przeciw skałom                                                               |
| Przytrzymany PPM                       | Laser wydobywczy: krótki zasięg 180 lub średni 320, duża moc przeciw skałom                                                        |
| PPM na Widmie                          | Kamuflaż optyczny 3 s; bazowe odnowienie 12 s; przytrzymanie nie powtarza aktywacji                                                |
| LPM / PPM na Mule                      | Dwa lasery / produkcja zestawu za 12 rudy i 2 komponenty z ładowni, wyłącznie przy zapasie zestawów 0                              |
| PPM na Bastionie                       | Krótkodystansowe granaty obszarowe z zapalnikiem 0,7 s                                                                             |
| LPM / PPM na Aegisie                   | Działko energetyczne / impuls tarcz                                                                                                |
| LPM / PPM na Atlasie                   | Rakieta dalekiego zasięgu / granaty z zapalnikiem 0,7 s; obie bronie zadają obrażenia obszarowe                                    |
| Kursor na wrogu przez 3 s na Atlasie   | Lock rakiet; pozostaje po przesunięciu kursora, znika po śmierci celu                                                              |
| C                                      | Kamuflaż starszych kadłubów; Widmo korzysta zamiast niego z PPM                                                                    |
| E                                      | Przeszukanie pobliskiego wraku                                                                                                     |
| Przytrzymany E                         | Dokowanie w strefie bazy przy prędkości poniżej 65 m/s                                                                             |
| Przytrzymany E przy sygnale ratunkowym | Podjęcie kapsuły/wraku: 4 s poniżej 80 m/s, bez ciągu, strzelania i naprawy                                                        |
| Przytrzymany E przy miejscu badawczym  | Skanowanie danych: 3 s w promieniu 180, przy prędkości do 60 m/s, bez ciągu, ognia i naprawy                                       |
| Przytrzymany E przy skrytce            | Otwarcie po 2,5 s w promieniu 150, poniżej 60 m/s, bez ciągu, ognia i naprawy; wybór prototypu lub pominięcie                      |
| Przytrzymany R                         | Naprawa napędu i 25 punktów kadłuba: 5 s lotu poniżej 80 m/s, bez ciągu, strzelania i interakcji; zużywa zestaw                    |
| 1–9                                    | Cel nawigacji: baza, pole rudy, pas, wrak, bogata żyła, sygnał ratunkowy, przekaźnik, obserwatorium, najbliższa nieotwarta skrytka |
| 0                                      | Terminal wrogiej placówki Cerber                                                                                                   |
| F                                      | Wskaż najbliższego drona; śledź go do zniszczenia                                                                                  |
| Przytrzymany G przy terminalu Cerbera  | Sabotaż: 3 s spokojnego lotu do 60 m/s; 1 komponent z ładowni; skaner nieaktywny przez 20 s, raz na wyprawę                        |
| Przytrzymany E przy terminalu Cerbera  | Przechwyt danych: 4 s, do 60 m/s, bez ciągu, ognia, lasera, naprawy i aktywnego alarmu                                             |
| Esc                                    | Pauza, sterowanie i głośność efektów                                                                                               |
| Tab                                    | Panel pokładu: szczegóły statku, pilot, prototypy, załoga i odzysk; pauzuje wyprawę                                                |

Zniszcz asteroidy laserem i podleć do kryształów. Chwytaki automatycznie wybierają pojedyncze surowce w swoim zasięgu, wysuwają ramię, zamykają szczęki i wracają z ładunkiem. Surowiec trafia do ładowni dopiero po powrocie ramienia. Nie ma magnesu ani przyciągania przez laser. Krótkie chwytaki mają zasięg 140, średnie 220, długie 300; liczba ramion zależy od kadłuba. Jasne bursztynowe skały zawierają komponenty. Kontrakt daje premię po bezpiecznym powrocie. Laser, strzelanie i ciąg wsteczny przerywają spokojne czynności: naprawę, skanowanie oraz podjęcie celu.

Czerwone, kanciaste drony oznaczają zagrożenie; HUD i minimapa pokazują patrol oraz pościg. Asteroidy zasłaniają statek i zatrzymują pociski. Możesz zniszczyć przeciwnika albo zgubić go, oddalając się od patrolowanego miejsca lub chowając za skałami. Strefa Aurory w promieniu 850 jednostek chroni przed ostrzałem dronów; zderzenia ze skałami nadal są niebezpieczne. Trafienia przerywają naprawę, skanowanie i odzysk. Premie wydobywcze kadłuba, pilota i modułu lasera wzmacniają laser; akcelerator ze skrytki zwiększa obrażenia działek przeciw dronom, zachowując ich słabą skuteczność przeciw skałom.

Kontrakty badawcze wymagają przywiezienia konkretnych danych: **Nasłuch sektora** — skan Lumen za 18 rudy i 3 komponenty; **Ślad dawnych gwiazd** — skany Lumen i Mnemos z jednej wyprawy za 30 rudy i 5 komponentów. Skan nie zajmuje ładowni, więc możesz również wydobywać. HUD wskazuje brakujące dane i kolejny cel. Nagroda jest dodatkiem do łupu i trafia do magazynu dopiero po dokowaniu. Częściowa wyprawa zachowuje łup, ale nie daje premii za niewykonany kontrakt.

W bazie kupujesz moduły silnika, dysz manewrowych, ładowni, lasera i pancerza, rozbudowujesz warsztat oraz magazyn i zatrudniasz pilotów z niewielkimi różnicami sterowania. Dysze dają +20% do maksymalnej szybkości skrętu i jego reakcji na poziom.

W **Piloci → Moi piloci** wybierasz osobę i rozwijasz jej umiejętności w panelu po prawej. Przeglądanie pilota nie zmienia wyboru do wyprawy; służy do tego przycisk ustawienia aktywnego pilota. Manewrowanie daje +3% do obrotu i hamowania na poziom, wydobycie +5% do obrażeń skałom, a procedury ewakuacji +6 punktów procentowych do szansy kapsuły. Każda umiejętność ma dwa poziomy; pięć poziomów pilota daje łącznie cztery punkty, więc nie rozwiniesz wszystkiego do maksimum. Przydział jest trwały, dostępny wyłącznie w bazie i nie kosztuje surowców.

Doświadczenie zdobywa pilot lecący na misję, po bezpiecznym dokowaniu: za przywieziony ładunek, unikalne skany, wykonany kontrakt i udany odzysk. Puste powroty i samo czekanie nie dają PD. Progi awansu to 20, 50, 90 i 140 PD. Przegrana nie daje doświadczenia; uratowany pilot zachowuje zdobyte wcześniej PD i umiejętności. Zapasowi piloci nie zdobywają doświadczenia za cudze wyprawy.

W **Hangar → Moje statki / Stocznia** możesz obejrzeć kadłuby, kupić statek i świadomie ustawić aktywny model. Moduły kupujesz w szczegółach aktywnego statku. Swift jest szybszym, lżejszym zwiadowcą, a Mule ma większy kadłub, ładownię i moc wydobycia przy wolniejszym locie. Oba wymagają warsztatu I. Zakup nie kasuje poprzedniego kadłuba — pozostaje on w rezerwie z własnymi modułami. Zapasowe statki przetrwają stratę aktywnego statku. Złomowanie rezerwy wymaga potwierdzenia i miejsca w magazynie na zwrot materiałów.

W zakładce **Załoga** zatrudniasz mechanika za 12 rudy. Jego kolejka mieści trzy zadania: rafinacja 8 rudy w 1 komponent (45 s) lub produkcja zestawu naprawczego z 6 rudy i 1 komponentu (30 s). Praca postępuje podczas wyprawy; pauza, pobyt w bazie i zamknięta gra zatrzymują postęp. Intendent Niko Rell ma drugą, niezależną kolejkę odzysku: 1 komponent w 5 rudy (60 s), po zatrudnieniu za 20 rudy i 2 komponenty przy warsztacie I. Oba stanowiska pracują równolegle. Materiały i miejsce na produkty są rezerwowane od razu; anulowanie zadania zwraca materiały w całości.

Przed startem automatycznie zabierasz maksymalnie dwa zestawy z zapasu bazy. Nowa kampania dostaje jeden zestaw. Mocne zderzenie może uszkodzić napęd i ograniczyć ciąg do 45%; hamulec nadal działa. Naprawa przywraca pełny ciąg. Niewykorzystane zestawy wracają po dokowaniu, a zestawy na utraconym statku przepadają. Mechanik i ukończona produkcja pozostają w bazie po porażce.

## Zapis

Postęp pozostaje lokalnie w przeglądarce. Zniszczenie statku lub odświeżenie aktywnej wyprawy zabiera aktywnego pilota i statek z hangaru; łup, dane i zabrane zestawy przepadają. Pilot może przetrwać w kapsule, a kadłub z modułami może nadawać się do odzysku. Szansa zależy od pilota, modelu statku i pancerza; aktualne wartości widać pod stacją w bazie. Baza, jej magazyn, historia wykonanych kontraktów i pozostali piloci pozostają. Przy braku środków można odebrać brakujące wyposażenie awaryjne i kontynuować grę.

W **Ratunek → wybierz sygnał → Wyrusz na ratunek** wracasz do początkowego układu sektora straty. Klawisz 6 wskazuje kapsułę/wrak. Podjęty cel podróżuje na holu i jest zabezpieczony dopiero po dokowaniu. Pilot wraca do załogi, a statek z własnymi modułami do rezerwy. Pełny hangar zamienia odzyskany kadłub na połowę zainwestowanych materiałów; nadwyżka magazynu przepada. Hol nie zajmuje ładowni i nie zmienia obecnego sterowania.

Nieudana akcja lub odświeżenie podczas niej traci jej pierwotny cel. Udany powrót bez podjęcia celu zachowuje sygnał na później. Baza pamięta do trzech sygnałów; czwarty wypiera najstarszy. Piloci w kapsułach rezerwują miejsce w limicie załogi, a licznik utraconych pilotów obejmuje straty trwałe.

Zapisy v0.1–v0.12 są automatycznie migrowane do formatu 10, z zachowaniem kampanii. Historia kontraktów jest naliczana od v0.5; wcześniejsze powroty nadal odblokowują Nasłuch sektora. Piloci z zapisów sprzed v0.6, także w kapsułach, zaczynają rozwój z 0 PD i zachowują tożsamość oraz cechę. Znacznik aktywnej wyprawy zachowuje swoją politykę straty także podczas migracji. Postęp pracy załogi i ostatnia pozycja statku są zapisywane co 5 s lotu i natychmiast po ukończeniu zadania; nie naliczamy pracy offline ani nie wznawiamy stanu fizyki. Odzysku nie losujemy ponownie przy odświeżaniu.

## Sprawdzenie kodu

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

Efekty dźwiękowe są oryginalnymi plikami WAV wygenerowanymi przez `node scripts/generate-sounds.mjs`. Obrazy gry powstają z figur Pixi, bez pobierania grafik z internetu.

Plan: [docs/plan-v0.1.md](docs/plan-v0.1.md). Implementacja i ograniczenia: [docs/implementation-v0.1.md](docs/implementation-v0.1.md).

Aktualne rozszerzenia załogi i napraw: [docs/implementation-v0.2.md](docs/implementation-v0.2.md).

Poprzedni model sterowania arcade: [docs/arcade-controls.md](docs/arcade-controls.md).

Flota i kadłuby: [docs/implementation-v0.3.md](docs/implementation-v0.3.md).

Ratunek i odzysk: [docs/implementation-v0.4.md](docs/implementation-v0.4.md).

Eksploracja i kontrakty badawcze: [docs/implementation-v0.5.md](docs/implementation-v0.5.md).

Doświadczenie i umiejętności pilotów: [docs/implementation-v0.6.md](docs/implementation-v0.6.md).

Patrole AI i pierwsza walka: [docs/implementation-v0.7.md](docs/implementation-v0.7.md).

Aktualne sterowanie WASD, celowanie, kamera i hol: [docs/implementation-v0.8.md](docs/implementation-v0.8.md).

Kadłuby, chwytaki i kamuflaż: [docs/implementation-v0.9.md](docs/implementation-v0.9.md). Etap 0.9 wprowadził format 7: zachowuje wcześniejszy postęp, dodaje dysze manewrowe na poziomie 0 i zamienia dotychczasowy Prospector na Bastion, także w rezerwie i wrakach. Nowe kampanie zaczynają słabszym Prospectorem I. Odświeżenie aktywnej wyprawy nadal oznacza jej stratę.

Skrytki i tymczasowe prototypy: [docs/implementation-v0.10.md](docs/implementation-v0.10.md). Etap 0.10 zachował format 7. Wersja 0.11 migruje go do formatu 8, dodając piąty kontrakt bez zmiany wcześniejszego postępu.
