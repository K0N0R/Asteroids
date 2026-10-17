# Rozbudowa zawartości po 0.52

Stan: 2026-10-16. Podstawa: lista autora przekazana po ukończeniu szkieletu kampanii. To backlog i propozycja kolejności prac, nie opis wdrożonych funkcji. Nie zmienia zapisu ani działania wersji 0.52.

## Bieżąca polityka zapisu

Uzupełnienie autora podczas prac nad 0.54: nie utrzymujemy zgodności ze starszymi zapisami. Nie mogą być otwierane. Dalsze pakiety mogą wprowadzać breaking changes; niezgodność oznacza komunikat i nową kampanię. To zastępuje wcześniejsze wymagania migracji w planach. Wersja 0.64 przyjmuje wyłącznie format kampanii 41 i dziennika 19; wcześniejsze są odrzucane.

Aktualna kolejność pakietów jest zapisana w [bieżącym planie](plan-current.md#uzgodniona-kolejność-dalszej-rozbudowy). Drony strażnicze wdrożono w 0.64; następne są role przeciwników, potem większe obrony baz. Scenariusz aktu I rozwijamy równolegle, bez przesądzania zwrotów, motywacji i finału.

## Ustalenia autora

Kampania ma operacyjny ciąg od Ziemi do Plutona. Kolejny etap to stopniowe rozbudowywanie sektorów, z zachowaniem możliwości przejścia gry. Nie należy wdrażać całej poniższej listy w jednej aktualizacji.

Anomalie wynikają z obecności obcej cywilizacji w Układzie Słonecznym. Istnieją trzy strony konfliktu: oficjalne wojsko Ziemi, wroga prywatna organizacja kosmiczna i obca cywilizacja. Nazwy, cele, relacje między prywatną organizacją a obcymi, tożsamość bossa oraz moment ujawnienia prawdy graczowi pozostają otwarte. Obcy nie otrzymują automatycznie roli jednoznacznego wroga.

Początkowo dostępne konstrukcje: Prospector i Swift. Pozostałe statki mają być odblokowywane. Specjalizację mają uzasadniać warunki misji: skradanie, szybkość, przewóz dużych ładunków, eskorta, intensywna walka i hakowanie. Ułatwienia hakowania dla Sokoła lub Feniksa są wskazanym przez autora kierunkiem do rozstrzygnięcia.

## Pełny backlog autora

| Obszar           | Zakres                                                                                                                                                                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Dialogi          | Sekwencje kwestii w dolnym panelu z portretem i osobą mówiącą; ręczne przechodzenie przez kolejne kwestie do końca sekwencji.                                                                                                                    |
| Reżyseria        | Kamera pokazuje wydarzenie poza widokiem gracza, komentarz dialogowy i powrót do statku. Animacje wylotu, dokowania oraz przejścia z kosmosu nad planetę.                                                                                        |
| Flota            | Początek z Prospectorem i Swiftem, odblokowania kolejnych kadłubów, praktyczne znaczenie specjalizacji i misje wymagające odpowiednich możliwości statku.                                                                                        |
| Walka            | Wytrzymalsi i liczniejsi wrogowie, większe fale oraz nowe typy przeciwników. Podczas obrony stacji pojawiają się poza ekranem bez wskaźnika kierunku nadejścia.                                                                                  |
| Bazy przeciwnika | Obiekt regularnie wysyła jednostki aż do zniszczenia bazy.                                                                                                                                                                                       |
| Misje            | Więcej rodzajów i unikalne zadania sektorów, dłuższe wyprawy, minigry inspirowane prostymi zadaniami przestrzennymi i technicznymi, zastępujące część przytrzymywania przycisków.                                                                |
| Eskorta          | Muł sterowany przez AI zbiera zasoby, gracz zapewnia osłonę.                                                                                                                                                                                     |
| Ratunek          | Holowanie sojuszników po wypadkach i atakach. Rozwinąć istniejące holowanie i odzysk w autorskie zadania kampanii.                                                                                                                               |
| Dostępność celów | Kolejna misja ujawnia się po wykonaniu poprzedniej. Pokazywać zadania ukończone i aktualne, ukrywać przyszłe.                                                                                                                                    |
| Powrót           | Autor chce blokady powrotu do bazy przed wykonaniem misji. Wymaga zaprojektowania rozliczania misji w locie i reguł przerwania, zanim zastąpi obecne krótkie wyprawy.                                                                            |
| Przestrzeń       | Większe sektory i dłuższe puste odcinki między interesującymi miejscami; nieregularne układy asteroid i dryf w trakcie wypraw.                                                                                                                   |
| Powierzchnie     | Większe obszary nad planetami, wystające i niszczalne skały, animowane przejścia.                                                                                                                                                                |
| Wydobycie        | Dłuższe zbieranie i niszczenie skał oraz więcej surowców z nazwami nawiązującymi do prawdziwych pierwiastków.                                                                                                                                    |
| Produkcja        | Osobne kategorie: rudy → komponenty → moduły → konstrukcje. Rudy przetapia się na komponenty, z nich składa moduły, a z modułów konstrukcje. Większy magazyn stacji.                                                                             |
| Satuk 15         | Więcej poziomów i modułów rozbudowy. Odblokowywana tarcza tworząca bezpieczny obszar oraz moduł sojuszniczych dronów AI patrolujących otoczenie.                                                                                                 |
| Merkury          | Pozyskanie Harpunem specjalnego materiału do ulepszeń tarcz kinetycznych stacji. Materiał odporny na pociski, laser, granaty i rakiety.                                                                                                          |
| Postacie         | Większa różnorodność twarzy, sylwetek portretów i włosów pilotów; portrety również w dialogach.                                                                                                                                                  |
| Oprawa           | Kierunek inspirowany załączonymi ilustracjami: wyraziste płaskie kolory, proste geometryczne bryły, zaokrąglone detale, warstwy cienia, czytelne planety i kosmiczne tła. Planety mają zachować rozpoznawalne cechy rzeczywistych odpowiedników. |

## Proponowana kolejność

Numery oznaczają pakiety robocze, nie obiecane numery wydań. Każdy pakiet musi zachować ukończalność kampanii od nowego zapisu i jasno odrzucać niezgodne formaty.

| Pakiet                         | Rezultat                                                                                                                                       | Dlaczego w tej kolejności                                                                                                  |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 1. Narracja i odkrywanie celów | System dialogów, pierwsza sekwencja objęcia dowodzenia, wspólny portret, ukrywanie przyszłych zadań, dziennik odkrytych i ukończonych celów.   | Wspólna podstawa dla późniejszych sektorów; umożliwia nadawanie sensu misjom bez dopisywania całej fabuły.                 |
| 2. Cykl wyprawy i flota        | Wybrana misja wyprawy, cele kończone w locie i osobne oddanie raportu; zasady odwrotu i blokady dokowania; początkowe kadłuby i odblokowania.  | Obecny model wymaga wielu bezpiecznych powrotów. Blokada dokowania bez tej zmiany tworzyłaby sprzeczne warunki zaliczenia. |
| 3. Gospodarka i stacja         | Mały początkowy zestaw rud, receptur i kategorii przedmiotów, większy magazyn, rozbudowa i tarcza Satuk 15.                                    | Stabilne koszty przed wyceną dużej liczby nowych zadań, nagród i odblokowań.                                               |
| 4. Pełniejszy akt I            | Jedna kompletna misja ratunkowa, minigra łączności, eskorta wydobywcza Muła, rozbudowana powierzchnia Księżyca i obrona.                       | Sprawdzenie nowych systemów na jednym dopracowanym odcinku zamiast powierzchownego zmieniania dziesięciu aktów.            |
| 5. Walka i obiekty AI          | Nowe role przeciwników, większe fale, baza produkująca kontakty, drony strażnicze stacji; limity i zasady rozstrzygania.                       | Systemy mają już konkretne scenariusze testowe z aktu I.                                                                   |
| 6. Ekspedycje i specjalizacje  | Większe przestrzenie, dryf i skupiska asteroid, kolejne minigry; Merkury z wydobyciem Harpuna; misje skradania, szybkości i intensywnej walki. | Każda nowa mechanika trafia najpierw do właściwego sektora i dostaje znaczenie dla statku.                                 |
| 7. Kolejne sektory i oprawa    | Unikalne misje kolejnych aktów, reżyseria scen, rozwój konfliktu trzech stron, wdrażanie uzgodnionej stylistyki.                               | Przenoszenie sprawdzonych systemów i budowanie odmiennych sytuacji, zamiast powtarzania zestawu zwiad–baza–patrol.         |

Prace artystyczne mogą rozpocząć się wcześniej od małej próbki: Ziemia, fragment tła, skała, portret, panel dialogu i stacja. Próbka powinna zostać oceniona w ruchu i przy ostrzale przed zmianą całego zestawu grafiki. Nie wymaga ponownego projektowania wszystkich sylwetek statków.

## Zalecenia projektowe — propozycje do oceny

### Długość, trudność i przestrzeń

Dłuższe misje powinny zawierać kilka różnych działań i zmieniającą się sytuację: dolot → odczyt → awaria lub kontakt → reakcja → ewakuacja. Samo zwiększenie HP skał, przeciwników i odległości wydłuży czas bez dodania decyzji. Najpierw należy sprawdzić jedną taką misję i ustalić docelowy czas wyprawy.

Nowe role przeciwników: lekki przechwytujący, osłonięta jednostka nacisku, wsparcie naprawiające i stawiacz min. To propozycje, nie zatwierdzony zestaw. Ich kombinacje powinny zmieniać priorytety, wymuszać ruch i korzystanie z osłon. Większa wytrzymałość ma pozostawiać czytelną reakcję na trafienia.

Pojawienie się poza ekranem trzeba liczyć względem aktualnej kamery i rozmiaru widoku. Brak strzałki kierunku nie oznacza pojawiania się pocisku na graczu: kontakt powinien fizycznie dolecieć i dopiero wejść w zasięg broni. Bazy produkujące jednostki potrzebują limitu aktywnych kontaktów i czytelnego tempa uzupełnień, aby długi lot nie tworzył nieskończonego nagromadzenia obiektów.

Puste odcinki mogą budować skalę. Warto pozwolić graczowi zdecydować o trasie i korzystaniu z szybkiego przelotu; dialogi i obserwacje mogą wypełniać część lotu. Nie trzeba umieszczać zagrożenia na każdym odcinku. Dryf powinien wynikać z prędkości fizycznych skał i zachowywać deterministyczność scenariuszy testowych.

### Powrót, ujawnianie i utrata jednostki

Proponuję oznaczać wyprawy jako swobodne albo zobowiązujące do ukończenia celu. Dla tych drugich blokada zwykłego dokowania byłaby pokazana przed startem. Możliwość awaryjnego przerwania z utratą nagrody jest propozycją wyjątku do zatwierdzenia, nie wdrożoną zmianą żądania autora. Konieczny jest przypadek testowy utraty obiektu zadania lub wyczerpania zasobu: gra musi umieć zakończyć próbę porażką i umożliwić ponowienie.

Docelowy interfejs może śledzić jedną bieżącą misję, zachowując listę ukończonych i tylko już odkrytych zadań dodatkowych. Jeżeli nadal mają istnieć równoległe cele główne, trzeba rozróżnić aktualny etap od aktualnie śledzonego celu. To decyzja do podjęcia przy pakiecie 1; nie należy niejawnie usuwać wcześniejszej swobody kolejności.

Wymagane statki muszą dać się zdobyć przed daną misją i odbudować po stracie. Starszy zapis z posiadanymi kadłubami nie powinien tracić statków przy dodaniu odblokowań. Sandbox powinien zachować pełny wybór do testów.

### Specjalizacja i interakcje

Sokół mógłby dłużej utrzymywać otwarte okno włamania i łagodniej podnosić alarm po błędzie. Feniks mógłby szybciej przełamywać zabezpieczenia kosztem silnego alarmu. To dwa odmienne sposoby wykonania tej samej minigry, zamiast dwóch premii do szybkości przytrzymania E.

Przykłady minigier: dopasowanie faz sygnału w łączności, przeprowadzenie obwodu przy włamaniu, wyrównanie ciśnienia lub zasilania przy naprawie. Powtarzanie ma być krótkie, a kolejne warianty zmieniać układ. Rozwój sprzętu może upraszczać opanowane czynności. Należy jawnie rozstrzygnąć, czy czas świata biegnie podczas interakcji; w misjach bojowych start interfejsu nie powinien ukrycie zamrażać ataku.

Surowiec merkuriański może być stabilnym złożem przeznaczonym do chwytania i wyrywania Harpunem, z czytelną reakcją na nieskuteczny ostrzał. Nazwa nie powinna sugerować, że znany pierwiastek jest w rzeczywistości odporny na wszystkie wymienione bronie. Można zachować rzeczywiste nazwy rud, a specjalną odporność wyjaśnić osobno strukturą materiału lub fikcyjnym pochodzeniem. Szczegóły fabularne wymagają decyzji autora.

### Produkcja, bezpieczeństwo i styl

Na początek wystarczy niewielka liczba rud i receptur. Cztery kategorie przedmiotów powinny różnić się funkcją; interfejs pokazuje cały koszt konstrukcji i brakujące składniki. Receptury nie mogą tworzyć cyklicznej blokady: moduł rafinerii nie może wymagać materiału dostępnego wyłącznie z tej rafinerii.

Tarcza Satuk 15 i drony mogą dawać odczuwalny rozwój bezpieczeństwa, ale zadania obronne muszą pozostać wykonalne przed ich zdobyciem. Proponowane dalsze ograniczenia to budżet energii i liczba dronów; wartości i zasady przebicia tarczy są do zaprojektowania. Nie należy automatycznie dodawać osobnej gospodarki energią bez określenia jej roli.

Z referencji warto przenieść czytelność sylwetek, rytm kształtów, ograniczone palety i proste cienie. Warstwa gry potrzebuje spokojniejszego tła niż ilustracja: pociski, skały, cele i statki muszą pozostawać widoczne. Kolor może wspierać trzy strony konfliktu, lecz rozpoznawanie musi działać także przez kształt, oznaczenia i zachowanie. Planety zachowują własne cechy geograficzne, pasy, pierścienie i proporcje; stylistyka nie wymaga fotorealizmu.

## Pierwszy zakres — wdrożony w 0.53

[Implementacja i wyniki sprawdzeń](implementation-v0.53.md): trzy odprawy ziemskie i stopniowe odkrywanie zadań. Poniższy opis zachowuje założenia tego pakietu. Wersja 0.54 dodaje cykl wybranej wyprawy dla zwiadu i walki, odwrót oraz odblokowania floty. Wersja 0.55 rozpoczyna pakiet gospodarki i stacji: ruda miedzi, przewodniki, moduły zasilania i wytwarzane segmenty magazynowe. Wersja 0.56 dodaje generator tarczy stacji wykorzystujący moduły zasilania. Wersja 0.57 dodaje minigrę ziemskiej łączności. Wersja 0.58 dodaje eskortę wydobywczą Muła. Wersja 0.59 dodaje misję ratunkową z minigrą obwodów i fizycznym holowaniem promu. Wersja 0.60 rozbudowuje powierzchnię Księżyca o odległy grzbiet miedziowy i przytwierdzone formacje skalne. Wersja 0.61 przenosi eskortę Muła do budowy na Księżycu: wspólne dostawy 160 Fe, wielokrotne kursy, naprawy za własne zasoby i odblokowanie kadłuba po fundamentach. Wersja 0.62 dodaje animowane przejścia między orbitą a powierzchnią. Wersja 0.63 wdraża pierwszą bazę produkującą jednostki: opcjonalną stocznię polową przy Marsie. Kolejne pakiety obejmują drony strażnicze Satuk 15, role przeciwników i dalszą rozbudowę sektorów.

### Założenia pierwszego pakietu

System sekwencji dialogowych oraz odkrywanie zadań, zastosowane do objęcia dowodzenia przy Ziemi. Panel z portretem, imieniem i kwestią; osobne naciśnięcie dla każdej kolejnej wypowiedzi; brak automatycznego przewijania. Rozdzielić przycisk dalszego ciągu od sterowania statkiem, aby zamknięcie panelu nie oddawało strzału. Odtwarzanie i ukończenie sekwencji mają identyfikatory; ponowne wczytanie nie może wielokrotnie wypłacać nagrody ani blokować wejścia do gry.

Pierwsza sekwencja ma przedstawiać objęcie dowodzenia i znane zadanie, bez ujawniania obecności obcych przed autorsko wybranym momentem. Definicje dialogów, warunki wyzwolenia i reżyseria kamery powinny być rozdzielone, aby później dołączyć przerywniki bez przepisywania wszystkich kwestii. Rozbudowane sceny kamery, gospodarka, walka i odblokowania statków stanowią kolejne pakiety, nie ukryty zakres tego pierwszego.

## Warunek ukończenia każdego pakietu

Grywalny fragment w docelowym sektorze, poprawne bieżące zapisy i odrzucanie niezgodnych, bezpieczne ponowienie po porażce, brak blokady postępu i regresja sandboxa. Testy z przygotowanym wejściem uzupełniać ciągłym przejściem od nowego zapisu. Gotowy system powinien mieć co najmniej jedną pełną misję pokazującą jego sens przed dodawaniem kolejnych wariantów.
