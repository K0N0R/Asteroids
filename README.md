# Orbit · Asteroids

Aktualna wersja **0.29** rozwija specjalizacje floty: **Widmo** zastępuje Swifta nową sylwetką i kamuflażem optycznym na **PPM** przez **3 s**, z bazowym odnowieniem **12 s**. **Mule** wydobywa na **LPM**, a na **PPM** tworzy zestaw naprawczy za **12 rudy / 2 komponenty z ładowni**, wyłącznie przy zapasie zestawów równym zero; po zużyciu może tworzyć następne. **Manta** holuje dwie jednostki, **Bastion** otrzymuje granaty zamiast lasera, a **Aegis** ma jeden chwytak. Prospector i Manta mają działko z lewej i laser z prawej strony dziobu. Lasery zadają także niewielkie obrażenia wrogim statkom. [Parametry i weryfikacja](docs/implementation-v0.29.md).

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
