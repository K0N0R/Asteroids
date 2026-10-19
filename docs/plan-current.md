# Aktualny plan rozwoju

Stan: 2026-10-19, wersja 0.86.

Ten plik określa aktualny backlog. `plan-v0.1.md`, `roadmap-after-v0.19.md` oraz opisy `implementation-*` zachowują historię decyzji; ich dawne zdania „następny etap” nie oznaczają niezrealizowanych zadań.

## Wdrożenie 0.86 — manifest i moduły bazy księżycowej

Pierwsza faza budowy wymaga 8 poszyć stalowych I, 4 maszynerii I, 3 elektronik I, 2 układów zasilania I i 2 systemów podtrzymywania życia I. Manifest może przewozić kilka rodzajów części naraz, z zachowaniem limitu ładowni. C i E przekazują wszystkie wymagane rodzaje z aktualnego etapu. Dostawy częściowe pozostają na budowie po utracie statku lub ponownym uruchomieniu gry.

Muł czeka na zamontowanie pięciu modułów. Następnie zbiera i dostarcza Żelazo (Fe) oraz Węgiel (C) do dalszej rozbudowy. Zbiera tylko aktualnie potrzebne pierwiastki i zachowuje darmową samonaprawę. Kadłub odblokowuje odbiór techniczny ukończonych instalacji. Baza ma większą, połączoną konstrukcję z zaokrąglonymi modułami pojawiającymi się po dostawach.

Zakres i ograniczenia: [wdrożenie 0.86](implementation-v0.86.md). Lokalna linia jest obecnie częścią automatycznego procesu budowy; osobny magazyn oraz menu ręcznej produkcji w placówce pozostają następnym etapem. Manifesty Marsa i Wenus również wymagają przeniesienia na części. Dalej: warianty materiałowe, części II–III, cztery obszary Ziemi i zapętlona muzyka. Format kampanii 54, dziennik 22.

## Wdrożenie 0.85 — urządzenia stacji z części

Zaplecze I–II, podstawowy generator tarczy, hangar dronów, ręczna odbudowa utraconych dronów i osłony kinetyczne I–II wymagają konkretnych części. Zakupy pobierają cały komplet atomowo. Rozbudowa nadal odblokowuje technologie; samo przetwarzanie pozostaje ręczne w Laboratorium i Warsztacie. Magazyn nie ma limitu ani opłat za pojemność.

Wspólny panel kosztów pokazuje ilustracje części, pełne nazwy i stopień skompletowania. Odbudowa dronów wycenia tylko utracone jednostki i nie leczy przy okazji uszkodzonych ocalałych. Pierwiastki do wyprodukowania pierwszego zaplecza są dostępne w początkowym rejonie Ziemi, bez hipernapędu lub wcześniejszej rozbudowy. Format zapisu 53 odrzuca poprzednie koszty.

Zakres: [wdrożenie 0.85](implementation-v0.85.md). Pakiet 0.86 wdraża manifest części i etapową bazę księżycową — najpierw dostawa wyposażenia do własnego przeróbstwa, potem Muł zbierający lokalne pierwiastki. Ten etap obejmie jednocześnie wymagania, dostawy, odblokowanie Muła i widoczne moduły budowy. Stary schemat dostaw księżycowych zastąpiono w 0.86. Warianty materiałowe, części II–III, cztery obszary Ziemi i zapętlona muzyka pozostają w planie.

## Wdrożenie 0.84 — moduły i uzbrojenie z części

Sześć zwykłych modułów statku oraz warianty uzbrojenia wymagają konkretnych części. Kolejny poziom mnoży cały komplet, bez dodatkowej opłaty surowym żelazem lub krzemem. Każdy statek zachowuje własne moduły i zakupione warianty, a zmiana posiadanego uzbrojenia w bazie pozostaje darmowa.

Hangar pokazuje pełne nazwy części przy wybranym module i uzbrojeniu. Zakup pobiera cały komplet atomowo. Złomowanie i recykling własnego wraku liczą połowę łącznej inwestycji z tych samych receptur; duplikat odzyskanego uzbrojenia daje właściwe części. Format zapisu 52 odrzuca starszą gospodarkę.

Zakres: [wdrożenie 0.84](implementation-v0.84.md). Następne kroki: koszty urządzeń stacji i manifesty kampanii, następnie warianty materiałowe oraz części II–III. Cztery obszary Ziemi, etapowa baza księżycowa i zapętlona muzyka pozostają w planie.

## Wdrożenie 0.83 — kadłuby z rodzin części

Stocznia buduje statki z indywidualnych kompletów sześciu rodzin części poziomu I. Zakładka Budowa w panelu statku pokazuje ilustracje, wymagane ilości i braki. Nie kupujemy kadłubów za surowe żelazo; usunięto ich dawne ceny z konfiguracji. Podstawowy napęd i zasilanie są dostępne w początkowym warsztacie, aby nie blokować pierwszych konstrukcji.

Zezłomowanie oraz recykling własnego wraku przy pełnym hangarze zwracają wszystkie właściwe rodziny części. Zwrot obejmuje także inwestycję w hipernapęd. Awaryjny statek zależy od posiadania części do odbudowy, a duży zapas pierwiastków nie blokuje pomocy po utracie ostatniego kadłuba. Format zapisu 51 odrzuca poprzednią gospodarkę.

Zakres i ograniczenia: [wdrożenie 0.83](implementation-v0.83.md). Moduły i uzbrojenie przeniesiono na części w 0.84. Pozostałe kroki: warianty i części II–III, urządzenia stacji oraz manifesty kampanii. Cztery obszary Ziemi i etapowa baza księżycowa nadal pozostają do wdrożenia. Zapętlona muzyka `theme_loop.mp3` pozostaje w planie poniżej.

## Wdrożone — kuleczki pierwiastków na skałach

Asteroidy i skały powierzchniowe mają okrągłe, kolorowe kuleczki zamiast nieregularnych oznaczeń zawartości. Kolory pochodzą z katalogu pierwiastków, a obecność kuleczek wynika z rzeczywistego składu skały lub odłamka. Kuleczki wskazują rodzaje pierwiastków, nie procentowy udział masowy. Usunięto barwienie całego obrazu miedzi, które zmieniało też kolory znaczników. Oznaczenia mają płaskie kolory, zaokrąglenia i brak obrysów.

## Do wdrożenia — zapętlona muzyka w tle

Ustalenie autora z 2026-10-19: dodać `frontend/assets/sounds/cc0/music/theme_loop.mp3` jako zapętloną muzykę w tle. Plik jest już w projekcie. Odtwarzanie ma respektować ustawienia włączenia i głośności muzyki, płynnie zapętlać utwór i nie tworzyć równoległych kopii podczas zmian widoków lub powrotów z lotu. Ten punkt pozostaje w planie; muzyka nie jest jeszcze podłączona.

## Wdrożenie 0.82 — rozpoznawanie złóż i zachowanie składu

Celownik na lokalnej skale pokazuje nazwę złoża i pełny urobek w pierwiastkach, razem z zawartością przyszłych odłamków. Zasięg czujnika wynosi 950 m od statku do powierzchni skały. Odczyt znika po opuszczeniu celu, zniszczeniu skały, przejściu na inną instancję, rozpoczęciu hiperskoku lub utracie statku. Ilości są porcjami gry, nie masą ani procentowym składem chemicznym.

Każda skała otrzymuje deterministyczny, niezmienny plan zawartości przy utworzeniu. Z planu korzystają skaner, rozpad i łup; fragmenty dziedziczą własną część złoża. Zachowano dotychczasowe źródła i wielkości wydobycia, aby ta paczka nie zmieniała równocześnie całego balansu kampanii. Instruktor pobiera najwyżej dwie porcje żelaza, a pozostałe zasoby pozostają w rzeczywistym odłamku. Przy pełnej puli skał zawartość niemożliwego do utworzenia fragmentu trafia do urobku; przy licznych luźnych porcjach powstają pakiety, zamiast utraty minerałów.

Format zapisu pozostaje 50 — nie dodano nowego stanu kampanii. Dalszy zakres: koszty floty i urządzeń oparte na rodzinach części, tiery II–III, manifesty budowy i cztery trwałe obszary Ziemi oraz lokalne przetwarzanie na Księżycu. To nie jest jeszcze nowy system klas mineralogicznych ani realistyczny rozkład składu asteroid.

## Wdrożenie 0.81 — pierwsza paczka gospodarki edukacyjnej

Interfejs po doprecyzowaniu autora: trzy niezależne zakładki w bocznej nawigacji — **Rozbudowa stacji**, **Laboratorium**, **Warsztat**. Rozbudowa ma stale widoczne podzakładki Zaplecze, Tarcze stacji i Drony, które podmieniają zawartość tego samego ekranu bez przejść i strzałek powrotu. Zawierają zakup poziomów zaplecza, tarcze i drony. Hipernapęd znajduje się w Hangarze, w ulepszeniach danego statku. Laboratorium zawiera wyłącznie procesy materiałowe, Warsztat wyłącznie produkcję części; każda zakładka zachowuje własny wybrany przepis. Nie ma wspólnego ekranu „Przemysł”.

Zaimplementowano katalog dziewięciu podstawowych pierwiastków i tytanu z Merkurego, siedem procesów laboratoryjnych oraz jedenaście receptur warsztatowych. Transakcje ręczne obsługują partie 1/5/10/maks., braki składników, poziom warsztatu i badania Merkurego. Są ilustracje cząsteczek, struktur i części, osobny ekran magazynu bez limitu oraz wspólne grafiki łupu i animacji transferu. Usunięto stan zatrudnienia, kolejki pracowników i ich produkcję podczas lotu. Utracone drony odbudowuje się ręcznie w bazie.

Muł gracza i AI naprawia się bez zestawów i surowców; inne statki nadal wymagają zestawów. Usunięto zasób paliwa, zbiorniki, tankowanie i jego koszty. Hipernapęd korzysta ze śluz bez paliwa; montaż wymaga przygotowanych części. Przed wylotem można załadować poszycie do działań w terenie. Manifest ma kontrolę dostępności i pojemności, zachowuje się w zapisie i nie daje doświadczenia za ponowny przywóz własnych zapasów. Format kampanii 50 odrzuca poprzednie zapisy.

To fundament, nie koniec refaktoru. Do następnej paczki pozostają: szczegółowe składy i rozpoznawanie złóż, pełne koszty statków i konstrukcji oparte na rodzinach części, warianty i poziomy II–III, przebudowa manifestów wszystkich aktów oraz samouczek chemiczny. Stare wewnętrzne klucze `ore`, `parts`, `crystals` i `copperOre` oznaczają teraz odpowiednio żelazo, poszycie stalowe I, krzem i miedź; ich nazwy techniczne i starsze opisy fabularne wymagają dalszego porządku. Nie dodano jeszcze czterech trwałych obszarów Ziemi, lokalnej produkcji na Księżycu ani nowego modułowego modelu budowy tej placówki.

## Najnowsze ustalenia autora — 2026-10-19

Ustalenia kierunkowe; stan ich realizacji opisano powyżej. Poniższe zasady zastępują sprzeczne starsze wpisy:

- Muł gracza i AI jako jedyny ma samonaprawę bez zestawów i bez surowców.
- Usuwamy paliwo hipernapędu. Zainstalowany napęd umożliwia nieograniczone korzystanie ze śluz; ewentualne wymagania jego poziomu pozostają na później.
- Jeden sektor ziemski ma cztery trwałe obszary: A orbita Ziemi, B orbita Księżyca z wejściem na powierzchnię, C duży klaster asteroid, D dalsza orbita z wrakami satelitów. Graf śluz: D ↔ A ↔ B ↔ C.
- Budowa bazy księżycowej: dostawy podstawowych części → lokalne przetwórstwo → aktywacja Muła i wydobycie → ukończenie modułowej placówki. Ręczna produkcja gracza jest dostępna także w uruchomionej bazie księżycowej; nie wraca produkcja pracowników w tle.
- Skały i asteroidy dają pierwiastki; wraki pojazdów dają konkretne części. Ikony części wyróżniają się od pierwiastków. Rozładunek do obu stacji pokazuje właściwe grafiki dostarczanych przedmiotów.
- Wygląd bazy księżycowej rozwija się etapami jako duży kompleks kopuł, hal, korytarzy i instalacji w zaokrąglonym stylu gry.

Szczegóły, etapy i kryteria sprawdzenia: [plan refaktoru gospodarki](chemistry-economy-refactor-plan.md).

## Nadrzędny nowy zakres: gospodarka edukacyjna

Autor zlecił na początek plan dużego refaktoru, bez wdrożenia nowej gospodarki: bezlimitowy magazyn, wydobywanie podstawowych pierwiastków, ręczne procesy chemiczne w bazie, produkcja części I–III i budowa z nich statków, osobna rozbudowa stacji oraz usunięcie zatrudnienia pracowników i produkcji podczas lotu. [Szczegółowy plan, zasady edukacyjne, kolejność i testy](chemistry-economy-refactor-plan.md). Ten kierunek zastępuje starsze plany rozbudowy pojemności magazynu i załogi produkcyjnej. Wersja 0.81 wdraża pierwszy etap; zakres pozostały do realizacji opisano powyżej.

## Polityka zapisu od 0.54

Decyzja autora: starsze zapisy są niekompatybilne i nie mogą być otwierane. Nie utrzymujemy migracji ani dziedziczenia floty. Parser przyjmuje tylko aktualny format; przy niezgodności pokazuje komunikat i tworzy nową kampanię. Historyczne opisy migracji nie są wymaganiem dla dalszych prac.

## Nowy kierunek po ukończeniu szkieletu

Autor przekazał zakres etapowej rozbudowy sektorów: dialogi i reżyseria, odblokowania floty, nowe misje i minigry, trudniejsza walka, rozbudowa stacji i gospodarki oraz nowa oprawa. [Pełny backlog, zależności, uwagi i proponowane pakiety](content-development.md). To nadrzędny kierunek dalszego rozwoju; historyczne ograniczenia poniżej nie wykluczają teraz wskazanych funkcji.

Nowy kanon: anomalie są wywołane obecnością obcej cywilizacji. Trzy strony konfliktu to wojsko Ziemi, wroga prywatna organizacja kosmiczna i obcy. Motywacje, relacje, boss i scenariusz ujawnień pozostają otwarte. Wersja 0.53 wdraża pierwszy pakiet: odprawy przy Ziemi i ujawnianie zadań. Pozostałe funkcje listy są backlogiem. Wersja 0.54 dodaje odblokowania i rozkazy zwiadu/walki z odwrotem. Wersja 0.55 wdraża pierwszy łańcuch gospodarki i segmenty magazynowe. Wersja 0.56 wdraża generator tarczy Satuk 15. Wersja 0.57 rozpoczyna pełniejsze misje aktu I minigrą łączności. Wersja 0.58 dodaje eskortę wydobywczą Muła. Wersja 0.59 dodaje misję ratunkową z zabezpieczeniem obwodów i fizycznym holowaniem. Wersja 0.60 rozbudowuje powierzchnię Księżyca o odległy grzbiet miedziowy i przytwierdzone formacje skalne. Wersja 0.61 przenosi eskortę Muła do budowy na Księżycu: wspólne dostawy 160 Fe, wielokrotne kursy, naprawy za własne zasoby i odblokowanie kadłuba po fundamentach. Wersja 0.62 dodaje animowane przejścia między orbitą a powierzchnią. Wersja 0.63 wdraża pierwszą bazę produkującą jednostki: opcjonalną stocznię polową przy Marsie. Wersja 0.64 dodaje drony strażnicze Satuk 15, 0.65 cztery role przeciwników, a 0.66 mieszane fale obrony placówek. Kolejne pakiety określa bieżący plan.

## Aktualizacja autora — 0.79

Cele podejmujemy w świecie, bez wyboru misji przed startem. Odzysk jest trwałą możliwością sektora; nieudana wyprawa nie usuwa wcześniejszego celu. Widok Ratunek pokazuje lokalizacje. Wdrożenie obejmuje także korektę instruktora, jego audio, napędu, podpisów oraz projekcji planet, Drogi Mlecznej i podejścia do Księżyca. [Zakres](implementation-v0.79.md). Ta decyzja ma pierwszeństwo przed historycznymi zasadami wyboru rozkazu i wygasania akcji ratunkowej.

## Uzgodniona kolejność dalszej rozbudowy

1. **Drony strażnicze Satuk 15**: wdrożone w 0.64, budowany hangar, trzy patrole, ograniczony zasięg, naprawa i płatna odbudowa. [Zakres](implementation-v0.64.md).
2. **Zróżnicowani przeciwnicy**: wdrożone w 0.65, przechwytujący, Pancernik, Serwisant i stawiacz min; mieszane składy stoczni marsjańskiej oraz osobny poligon. [Zakres](implementation-v0.65.md).
3. **Obrony baz**: wdrożone w 0.66 — trzy mieszane fale, 6 napastników na Księżycu i Wenus, 9 na Marsie; podejścia spoza aktualnej kamery, bez zapowiedzi kierunku. Tarcza i drony pozostają lokalną ochroną Satuk 15, nie odległych placówek. [Zakres](implementation-v0.66.md).
4. **Hakowanie i minigry**: wdrożone w 0.67 — obwody włamania, przekierowanie zasilania, ślad i alarmy oraz odmienne ułatwienia Sokoła i Feniksa. Uzupełniają istniejące strojenie łączności i naprawę obwodów promu. Kolejne warianty napraw instalacji można rozwijać przy zadaniach sektorów. [Zakres](implementation-v0.67.md).
5. **Merkury i Harpun**: wdrożone w 0.68 — osobna odnoga z odpornym złożem, wydobycie szczękami Harpuna, płyty i moduły osłonowe oraz tarcza kinetyczna I–II. Zadanie dodatkowe prowadzi przez ten łańcuch. [Zakres](implementation-v0.68.md).
6. **Większe sektory i hipernapęd**: pierwszy pakiet wdrożony w 0.69 — ziemska orbita o promieniu 5,5 km, trzy obszary, dwie dwukierunkowe trasy ze śluzami, spacja, ogniwa, produkcja i tankowanie, animacja przelotu i śmiertelne kolizje sprawdzane na całej drodze. Śluzy sprawdzają przejezdność przed startem; nie zapewniają odporności na późniejsze wtargnięcie obiektu. 0.70 dodaje nieregularne ziemskie złoża i fizyczny dryf dalekiego pola, z zapasem miejsca wokół śluz. Dalej: rozbudowa pozostałych sektorów i alternatywne trasy. [Nawigacja](implementation-v0.69.md), [skupiska i dryf](implementation-v0.70.md).
7. **Gospodarka i Satuk 15**: 0.68 wdraża spiek, płyty kinetyczne, moduły osłonowe, dwie receptury, dwa poziomy tarczy i dwa wzmocnione segmenty magazynu po +400. Dalsze rudy, konstrukcje i moduły rozwijać wraz z zadaniami sektorów; ten kierunek pozostaje otwarty.
8. **Dłuższe misje specjalistyczne**: skradanie, przechwycenia, transport i walka; kilka etapów oraz zmiany sytuacji podczas wyprawy.
9. **Powierzchnie, anomalie i unikalne zadania sektorów**: 0.68 dodaje odnogę wydobywczą Merkurego z własną osłoną skalną i zadaniem. Dalej odmienne warunki, przeszkody i cele; 0.75 dodaje pierwszą misję ze skażonym terenem, nieregularnymi pasmami i fizycznym odzyskiem sondy przy Jowiszu. Dalsze układy i sektory pozostają do rozbudowy.
10. **Reżyseria**: animacja śmierci wdrożona w 0.69 — rozpad, utrata sygnału i opóźnione rozliczenie bez dalszego zaliczania celów. Dalej animacje dokowania i wylotu, kamera w świecie gry oraz dialogi reagujące na odkrycia i zagrożenia.
11. **Grafika i piloci**: na prośbę autora priorytet przesunięty przed animacje dokowania. 0.77 wdraża wspólną paletę, interfejs, planety wszystkich sektorów, stację, pastelową flotę i asteroidy. 0.78 usuwa płyty HUD i obrysy, zaokrągla obiekty, stabilizuje tło oraz poprawia wydobycie i lasery jednostek AI. [Korekta](implementation-v0.78.md). Dalej przeciwnicy, instalacje misji, efekty i różnorodne portrety oraz powierzchnie kolejnych planet. [Pierwszy pakiet](implementation-v0.77.md).
12. **Udźwiękowienie**: 0.76 przegląda sześć paczek (206 nagrań) i wdraża 22 przygotowane efekty z czterech paczek CC0. Zastępuje stare efekty, dodaje hipernapęd i alarm skażenia, wygładzone pętle, rezerwę głosów i przyciszanie maszyn. Dalszy balans odsłuchowy podczas gry pozostaje otwarty. [Zakres](implementation-v0.76.md).
13. **Pełne przejście i balans**: ciągły nowy zapis, ekonomia, odblokowania, czas wypraw, straty i trudność; przygotowane sektory tylko jako uzupełnienie.

Pakiet początku gry: 0.71 wdraża przy Ziemi automatyczne potwierdzenia odczytów przez rozmowę z bazą, animowany transfer C bez dokowania, częściowe dostawy do ziemskich zadań i poprawne otwarcie powrotu po potwierdzonym celu. 0.72 rozszerza cykl na Księżyc: raporty zwiadu, odbioru, ratunku i obrony, odblokowanie powierzchni i Muła podczas lotu oraz transfer C do budowy i Satuk 15 na orbicie. 0.73 dodaje drugiego Prospectora AI przy Ziemi: prowadzenie do bieżącego celu, omijanie skał, radio, oczekiwanie po utracie kontaktu i brak blokady po stracie. 0.74 rozszerza raportowanie na akty II–X: odczyty, patrole, obrony, przeszkody pasa, stocznie i bossów. [Ziemia](implementation-v0.71.md), [Księżyc](implementation-v0.72.md), [instruktor](implementation-v0.73.md). [Pełne uzupełnienie autora oraz zależności](content-development.md#uzupełnienie-autora--2026-10-17). Instruktor przy Ziemi jest wdrożony. Raporty w aktach II–X wdrożone w 0.74; nowe miejsca nadal powstają przy kolejnym wylocie, a fizyczne dostawy wymagają powrotu. [Raportowanie](implementation-v0.74.md). 0.75 wdraża pierwszą misję odzysku przy Jowiszu: skażone pasma, objazd 3/4/5, fizyczny hol sondy i potwierdzenie dostawy przez radio. [Anomalia](implementation-v0.75.md). 0.76 wdraża nowe efekty, pętle i miks z paczek dźwiękowych. [Dźwięki](implementation-v0.76.md). 0.77 rozpoczyna szeroki lifting wyglądu na prośbę autora. [Oprawa](implementation-v0.77.md). Dalej ujednolicenie pozostałych obiektów i pilotów, animacje dokowania i wylotu oraz kolejne warianty unikalnych zadań sektorów.

Scenariusz aktu I rozwijamy równolegle. Kluczowe zwroty, motywacje stron i finał pozostają do wspólnego ustalenia. Ta kolejność ma pierwszeństwo przed dawnymi sugestiami „następny etap” w historycznych raportach.

## Zrealizowany zakres

- Pętla lobby → proceduralna wyprawa → powrót lub strata; trwała progresja i wersjonowany zapis.
- Wydobycie, chwytaki, rudy żelaza i miedzi, komponenty, moduły i konstrukcje; przetop, ulepszenia statków i stacji.
- Walka z AI, infiltracja, sabotaż, prototypy, fortyfikacje i eskorta Keplera.
- Tarcze kinetyczne, ratunek, fizyczny hol, wiele dostaw do Aurory bez kończenia rundy.
- Dwanaście kadłubów w stoczni i dwa odzyskiwane z wraków. Swift i Widmo są osobnymi specjalizacjami; Widmo ma dash i optyczny kamuflaż.
- Piloci i ich rozwój; mechanik i intendent pracują wyłącznie w stacji.
- Lifting lobby i HUD, grafika geometryczna, efekty trafień, radar i dźwięki CC0.

## Stabilizacja 0.33

[Zakres, poprawki i ograniczenia weryfikacji](stabilization-v0.33.md).

## Etap 0.34 — wdrożony

Odzysk technologii i wrogich kadłubów, Swift/Widmo, warianty uzbrojenia wszystkich statków, pasywne zakłócanie radarów, usunięcie personelu pokładowego, lifting modułów i wzmocnienie ścian. [Szczegóły](implementation-v0.34.md).

## Etap 0.35 — wdrożony

Czytelne parametry i podgląd modułów w stoczni, wyposażenie dopasowane do kadłubów, nieregularny Aegis oraz szersze Widmo z ulepszanym dashem, smugą i wychodzeniem z przeszkód do przodu. [Szczegóły](implementation-v0.35.md).

## Pancerz floty — wdrożony

Wszystkie kadłuby mają poszycie, pogrubione obramowania lub osobne płyty zamiast cienkich linii ulepszeń. [Zestawy, kontrola wizualna i propozycje dalszych kroków](hull-armor.md).

## Decyzja o kierunku prac

Aktualna mapa, kontrakty i pętla gry są testowym sandboxem do weryfikacji mechanik, statków i balansu. Nie utrwalamy ich jako docelowej kampanii. Lifting wyglądu statków jest zakończony; nie jest kolejnym priorytetem.

Najpierw domykamy fundamenty i narzędzia testowe. Fabuła, kampania oraz kolejne etapy rozgrywki następują po ocenie tych fundamentów. Dawne propozycje dalszych liftingów i śladów uszkodzeń nie są obowiązkowym zakresem przed kampanią.

## Etap 0.36 — wdrożony

Indywidualny podgląd modułów 0–III oraz porównanie nominalnego parametru przed/po w hangarze i stoczni. Podgląd nie zmienia ekonomii ani konfiguracji wyprawy. [Zakres i weryfikacja](implementation-v0.36.md).

## Etap 0.37 — wdrożony

Osobny tryb Sandbox / testy z sześcioma scenariuszami, wszystkimi kadłubami, wariantami uzbrojenia, modułami 0–III i wyborem seeda. F6 ponawia konfigurację, F7 kończy próbę raportem. Lokalna kampania testowa nie zapisuje nagród ani strat do zwykłej kampanii. [Obsługa, pomiary i weryfikacja](implementation-v0.37.md).

## Etap 0.38 — wdrożony; fundamenty technicznie zamknięte

Wykonano audyt cykli mechanik, pierwszą rundę 224 porównań kadłubów i modułów, przejście zwykłej ekonomii od Prospectora do warsztatu II oraz pomiary rzeczywistego renderowania. Naprawiono zwalnianie własnych kontekstów grafiki w Pixi i pomiar osłony impulsowej Aegisa. Raport F7 pokazuje FPS, p95, długie klatki i dostępną pamięć JS. Zestaw regresji: 304 testy, w tym długie próby symulacji i rozliczenia sukcesu, porażki oraz odzysku.

**Pierwszy duży etap implementacji można uznać za technicznie zamknięty.** Nie ma ujawnionego blokera przed projektowaniem docelowych misji i kampanii. Wyniki, macierz weryfikacji, dane porównań i ograniczenia pomiarów: [raport 0.38](implementation-v0.38.md).

## Etap 0.39 — trwałe sektory i początek aktu I wdrożone

Autor określił kierunek fabularny: anomalie w Układzie Słonecznym, admirał Sił Kosmicznych Ziemi, stacja Satuk 15 i dziesięć aktów od Ziemi do Plutona. [Zarys kampanii, zasady sektorów i propozycja aktu I](campaign-outline.md) rozróżnia ustalenia autora od proponowanych doprecyzowań.

- Wdrożono osobny zapis Satuk 15, dziennik równoległych zadań głównych i dodatkowych, zależności i jednorazowe nagrody. Stary zapis testowy pozostaje dostępny z lobby.
- Grywalne: lokalne wydobycie, przekaźnik, warsztat I, rozszerzenie orbity Ziemi, odczyt dalszej trasy i zwiad na trasie księżycowej. Można wracać między odblokowanymi sektorami. [Zakres i weryfikacja](implementation-v0.39.md).

## Etap 0.40 — powierzchnia Księżyca i budowa stacji paliw wdrożone

Po zwiadzie trasy dostępne jest wejście na powierzchnię z własnym terenem, radarem i złożem. Gracz przewozi 48 rudy i 12 komponentów na budowę, zatwierdza częściowe dostawy i wraca z raportem odbioru. Osobny przycisk wylotu ładuje materiały z magazynu. Przejścia zachowują statek, ładunek i hol; zapis obsługuje także stratę oraz ratunek na powierzchni. [Zakres, migracja i weryfikacja](implementation-v0.40.md).

## Etap 0.41 — obrona budowy wdrożona

Po fundamentach dostępny jest równoległy cel Osłona budowy: trzy zapowiadane fale asteroid, 100 HP konstrukcji, widoczne zagrożenia i jednorazowa nagroda. Porażkę można ponowić bez utraty dostaw; wyjście na orbitę przerywa próbę. Starsze odebrane stacje zachowują swój stan, a nowy cel jest dopisywany jako niedokończony. [Zakres i weryfikacja](implementation-v0.41.md).

## Etap 0.42 — finał mechaniczny aktu I wdrożony

Obrona stacji księżycowej przed trzema kontaktami AI odblokowuje się po odbiorze i osłonie budowy. Napastnicy mogą ostrzeliwać stację lub statek. Bezpieczny powrót z raportem zamyka akt I, wypłaca jednorazową nagrodę i pokazuje dalszy kierunek — Mars. Tożsamość napastników i fabularna treść zwrotu pozostają otwarte. [Zakres i weryfikacja](implementation-v0.42.md).

## Etap 0.43 — marsjański początek aktu II wdrożony

Mars odblokowuje się po końcowym raporcie aktu I. Zwiad przekaźnika i neutralizacja dwóch patroli to równoległe cele. Bezpieczne powroty zatwierdzają raporty walk, również pojedynczego kontaktu na wyprawę. Oba cele otwierają dalszy obszar z odczytem pasa asteroid i komunikatem brakującej technologii. Wcześniejsze sektory pozostają dostępne. [Zakres, migracja i weryfikacja](implementation-v0.43.md).

## Etap 0.44 — odprawa ziemska i otwarcie Wenus wdrożone

Powrót z raportem o blokadzie pasa udostępnia przy Ziemi odprawę Nowy kierunek. Zatwierdzenie planu wskazuje Merkurego jako cel pozyskania technologii, zamyka mechaniczny ciąg aktu II i otwiera Wenus. Początek aktu III: zwiad orbity, pomiary miejsca pod przyszłą placówkę oraz trwały projekt 32 rudy. Cele mają przypisane akty, więc późniejsze zadania na Ziemi nie blokują wcześniejszego ukończenia aktu I. [Zakres, zapis i weryfikacja](implementation-v0.44.md).

## Etap 0.45 — placówka Wenus i mechaniczne domknięcie aktu III wdrożone

W miejscu pomiarów powstaje orbitalna placówka: E przez 2 s po zatwierdzeniu miejsca i zgromadzeniu 32 rudy. Zbudowany obiekt jest trwały, a ruda nie jest pobierana ponownie. Potem można równolegle przygotować osłonę słoneczną za 12 komponentów i obronić placówkę przed trzema kontaktami AI. Obrona wymaga bezpiecznego powrotu z raportem. Jej ukończenie i gotowy projekt osłony domykają mechaniczny ciąg aktu III. Osłona jest trwałą gotowością ekspedycji; działanie w nowym środowisku termicznym będzie częścią Merkurego. [Zakres, zapis i weryfikacja](implementation-v0.45.md).

## Etap 0.46 — Merkury i mechaniczny ciąg aktu IV wdrożone

Gotowa i obroniona placówka Wenus wraz z osłoną słoneczną otwierają Merkurego. Sektor ma temperaturę, zapowiadane rozbłyski i cień rzeczywistych dużych asteroid. Osłona zmniejsza nagrzewanie; przegrzanie uszkadza kadłub i przerywa pracę. Pomiary podejścia, walka z patrolem i Lancerem oraz odzyskanie pakietu danych kończą się bezpiecznymi powrotami. Zabezpieczona technologia jest trwałą gotowością do dalszej drogi; nie określa jej fabularnej natury. [Zakres, zapis i weryfikacja](implementation-v0.46.md).

## Etap 0.47 — baza marsjańska i mechaniczny ciąg aktu V wdrożone

Po bezpiecznym odzyskaniu technologii powrót na Marsa otwiera nowe projekty: 40 rudy i 10 komponentów, montaż bazy, obronę przed trzema kontaktami oraz niezależne zabezpieczenie korytarza z patrolem i dwoma Lancerami. Oba cele bojowe można wykonywać w dowolnej kolejności. Są też opcjonalne pomiary dalszej trasy. Dziennik aktu II pozostaje dostępny na drugiej stronie, a wcześniejsze akty zachowują ukończenie. [Zakres, migracja i weryfikacja](implementation-v0.47.md).

## Etap 0.48 — przejście pasa i mechaniczny ciąg aktu VI wdrożone

Osobny sektor Pas odblokowuje się po technologii z Merkurego i zabezpieczeniu bazy marsjańskiej. Zwiad wejścia rozszerza obszar do 5,7 km; trzy rzeczywiste skały mają niezależne raporty i znikają trwale po ich dostarczeniu. Kolejność usuwania i liczba wypraw są dowolne. Po oczyszczeniu trasy można potwierdzić zewnętrzną granicę pasa. Ruchome odłamki tworzą zagrożenie środowiskowe, a dwa patrole są celem opcjonalnym. Wcześniejsze sektory pozostają dostępne. [Zakres, migracja i weryfikacja](implementation-v0.48.md).

## Etap 0.49 — operacyjny zakres aktu VII przy Jowiszu wdrożony

Przejście pasa otwiera Jowisza. Zwiad rozszerza obszar do 4,7 km, a raporty z patrolu i Lancera oraz włamania do węzła — do 6,1 km. Węzeł korzysta z rzeczywistego terminala, obrotowego skanera, alarmu, dwóch obrońców i opcjonalnego sabotażu za komponent z ładowni. Po wykonaniu obu równoległych celów można odzyskać dalszy pakiet obserwacyjny. Bezpieczne powroty zachowują raporty i jednorazowe nagrody. **To przygotowany ciąg operacyjny aktu VII; jego kluczowe ujawnienie fabularne nie zostało dopisane.** [Zakres, migracja i weryfikacja](implementation-v0.49.md).

## Etap 0.50 — Saturn i mechaniczny zakres aktu VIII wdrożony

Operacyjne cele Jowisza otwierają Saturna. Rozpoznanie pierścieni rozszerza sektor z 2,5 do 4,2 km, a przywiezienie 36 rudy oraz raport z jednego odległego patrolu otwierają obszar 5,4 km z odczytem dalszej trasy. Zaopatrzenie zalicza się z rzeczywistego ładunku udanych wypraw, może być rozdzielone na transporty i nie pobiera ponownie rudy z magazynu. Opcjonalne złoże kryształów zachęca do eksploracji; osobny projekt rezerwy nie blokuje celu głównego. [Zakres, migracja i weryfikacja](implementation-v0.50.md).

## Etap 0.51 — Uran, Neptun i pierwsze starcie w akcie IX wdrożone

Saturn otwiera Urana. Zwiad, dane chronionej bazy i dwa kontakty bojowe prowadzą do odczytu trasy do Neptuna. Tam zwiad i włamanie do drugiej bazy otwierają rejon pierwszego starcia. G przez 2 s uruchamia zapowiedź i dwufazową ciężką jednostkę, która wycofuje się przy 25% pancerza. Opuszczenie rejonu, limit czasu i strata statku przerywają próbę; raport wymaga bezpiecznego powrotu. Po nim dostępny jest odczyt zewnętrznej trasy. Opcjonalne cele nie blokują przejścia. [Zakres, migracja i weryfikacja](implementation-v0.51.md).

## Etap 0.52 — Pluton i mechaniczny finał aktu X wdrożone

Neptun otwiera Plutona. Zwiad udostępnia bazę i dwa kontakty na podejściu; raporty tych równoległych celów otwierają rejon finału. G przez 2 s uruchamia zapowiedź i trzyfazową jednostkę: pojedyncze pociski, wachlarz trzech, potem pięciu. Bezpieczny powrót rozlicza finał i jednorazową nagrodę, pozostawiając wcześniejsze sektory oraz cele dodatkowe dostępne. To domknięcie operacyjnego ciągu, bez dopisywania prawdy o anomalii i fabularnego zakończenia. [Zakres i weryfikacja](implementation-v0.52.md).

## Etap 0.53 — dialogi i odkrywanie zadań wdrożone

Trzy odprawy ziemskie mają portrety, ręczne przechodzenie i trwałą historię. Ostatnią można powtórzyć. Panel wyprawy, HUD i TAB ukrywają przyszłe cele, zachowując dostępne zadania równoległe, dodatkowe oraz historię ukończonych. Starsze zapisy zachowują postęp i pomijają spóźnione odprawy. [Zakres i weryfikacja](implementation-v0.53.md). Następny pakiet: wybrana wyprawa, zasady przerwania i odblokowania floty.

## Etap 0.54 — flota i rozkazy wypraw wdrożone

Prospector i Swift są dostępne od początku, pozostałe projekty otwierają raporty kampanii. Można wybrać zwiad, patrol lub bossa jako cel przed startem; wykonanie celu otwiera dokowanie, a raport rozlicza dopiero powrót. TAB umożliwia potwierdzany odwrót bez nagrody, raportu i ładunku. Swobodne loty pozostają dostępne. Starsze formaty są odrzucane, bez migracji. [Zakres i weryfikacja](implementation-v0.54.md).

## Etap 0.55 — wdrożony

Pierwszy łańcuch przemysłowy: wydobycie Cu → przewodniki → moduły zasilania → segmenty magazynowe. Panel Stacja → Przemysł, wspólna kolejka mechanika i trzy dodatkowe segmenty po +200 miejsca. Format kampanii 35 odrzuca starsze zapisy. [Zakres i weryfikacja](implementation-v0.55.md).

## Etap 0.56 — wdrożony

Generator tarczy odblokowywany po zapleczu ziemskim i montowany z modułów zasilania, Fe i komponentów. Ochrona na orbicie 260 → 850 m, wspólny promień fizyki, AI, pocisków, grafiki i radaru; brak osłony stacji na powierzchniach. Format kampanii 36 bez migracji. [Zakres i weryfikacja](implementation-v0.56.md).

## Etap 0.57 — wdrożony

Ziemski przekaźnik: trzy kanały strojenia fazy, ręczne zatwierdzanie i ponowienie, działająca symulacja pod panelem, przerwanie przez trafienie lub utratę zasięgu oraz rozliczenie raportu po powrocie. [Zakres i weryfikacja](implementation-v0.57.md).

## Etap 0.58 — wdrożony

Dodatkowa ziemska eskorta wydobywcza Muła po uruchomieniu zaplecza. AI wyznacza drogę, czeka na gracza, rozbija skały i zbiera rzeczywistą rudę, a po załadunku wraca do doku. Zasadzka, stan kadłuba, jasna porażka i możliwość ponowienia; rozliczenie po powrocie gracza. Format kampanii 37 i dziennika 16 bez migracji. [Zakres i weryfikacja](implementation-v0.58.md).

## Etap 0.59 — wdrożony

Dodatkowy Sygnał ratunkowy po zwiadzie Księżyca: patrol, minigra łączenia obwodów, fizyczny hol promu, dostawa do Satuk 15 i zatwierdzenie raportu. Uszkodzenia, odłączenie i ponowne podpięcie oraz powtarzalna próba po porażce. Format kampanii 38 i dziennika 17 bez migracji. [Zakres i weryfikacja](implementation-v0.59.md).

## Następne kroki kampanii

- Rozbudować powierzchnię Księżyca: przestrzeń, niszczalne formacje i działania przy placówce.

- Przeprowadzić testy graczy całego aktu I, dopracować tempo, trudność i komunikowanie wymagań.
- Uzupełnić dialogi i oprawę fabularnego zwrotu aktu I po ustaleniu jego treści przez autora.
- Uzupełnić kluczowe ujawnienie aktu VII po ustaleniu jego treści przez autora. Zabezpieczony pakiet obserwacyjny daje punkt zaczepienia do tej sceny.
- Przeprowadzić ciągłe przejście całej kampanii od nowego zapisu: ekonomia, czas wypraw, wymagania wyposażenia, poziomy pilotów i narastanie trudności. Dotychczasowe testy zwykłych wypraw sprawdzają sektory z przygotowanym wejściem, nie zastępują takiej sesji.
- Dopracować różnice sektorów i starć na podstawie testów graczy.
- Uzupełnić fabularny finał aktu X: mechanizm anomalii powodowanych obecnością obcych, motywacje stron, tożsamość bossa i scenariusz ujawnienia. Sandbox pozostaje niezależnym narzędziem regresji.

Pierwotny zarys nie wprowadzał paliwa statków. Uzupełnienie autora z 2026-10-17 dodaje do planu paliwo hipernapędu i drugi Prospector sterowany przez AI; nie oznacza to ręcznego sterowania wieloma jednostkami jednocześnie. Obecność obcych jako źródło anomalii jest już ustalona; ich mechanizm, motywacje stron, tożsamość bossa i dokładna treść kluczowych zwrotów pozostają do napisania. Wersja 0.42 domknęła ciąg mechanik aktu I, 0.44 aktu II, 0.45 przygotowania i obronę aktu III, 0.46 wyprawę aktu IV, 0.47 bazę i walki aktu V, a 0.48 przejście pasa w akcie VI. Dialogi, sceny oraz tempo aktów wymagają dalszego opracowania. Wersja 0.49 dodaje operacyjne cele Jowisza, lecz nie zamyka fabularnego ujawnienia aktu VII. Wersja 0.50 dodaje spokojniejszy operacyjny odcinek Saturna. Wersja 0.51 dodaje operacyjny ciąg Urana i Neptuna oraz pierwszą dwufazową walkę. Wersja 0.52 dodaje Plutona i trzyfazowy mechaniczny finał aktu X.

Balans pozostaje iteracyjny. Pierwsza runda pokazała różnice specjalizacji i dostępność ekonomii; kolejne testy graczy powinny szczególnie ocenić bazowe Widmo przeciw zwrotnym patrolom, wygodę broni wymagających ponawiania naciśnięć oraz tempo rozwoju. Będą też potrzebne dłuższe sesje renderowania i próby na słabszym sprzęcie. Nie są to automatyczne zgody na nowe statki, liftingi ani systemy części.

## Kierunki poza bieżącym zakresem

Wymienne modele części, nowe profesje personelu i kolejne placówki/role przeciwników pozostają propozycjami. Nie są warunkiem rozpoczęcia kampanii ani automatycznie zatwierdzonym zakresem najbliższego etapu. Ewentualny system części wymaga osobnej specyfikacji slotów, kompromisów, montażu i reguł odzysku.

## Świadomie odłożone

- Produkcja przy zamkniętej grze. Obecnie postępuje wyłącznie w czasie symulacji wyprawy.
- Wznowienie aktywnej wyprawy. Odświeżenie nadal rozlicza ją jako przegraną, zgodnie z przyjętą zasadą.

Kampania ma zarys autora, przechodnie mechanicznie akty I–VI i operacyjne zakresy aktów VII–X. Trzy strony konfliktu są ustaleniem fabularnym; osobna reputacja, dyplomacja lub symulacja relacji nie wynikają z tego automatycznie. Multiplayer pozostaje poza zakresem. Nową kolejność rozwoju zawartości opisuje dokument podlinkowany na początku planu.

## Etap 0.60 — wdrożony

Większa powierzchnia Księżyca, opcjonalny grzbiet miedziowy (5), niszczalne przytwierdzone formacje i luźne odłamki. Dotychczasowe trasy dostaw oraz obrona placówki zachowane. [Zakres i weryfikacja](implementation-v0.60.md).

## Etap 0.61 — wdrożony

Eskorta Muła jest częścią głównej budowy na Księżycu. Cel 160 Fe, powtarzane kursy z ładownią 110, naprawy za własne zasoby, wspólne dostawy gracza i transportu, odblokowanie kadłuba po fundamentach. Format kampanii 39 i dziennika 18, bez migracji. [Zakres i weryfikacja](implementation-v0.61.md).

## Etap 0.62 — wdrożony

Animowany transfer orbitalny i powierzchniowy na Księżycu. Wygaszenie podejścia, horyzont i zbliżenie kamery, neutralizacja sterowania oraz pauza świata na czas przelotu. Ładunek, hol i postęp budowy zachowane. [Zakres i weryfikacja](implementation-v0.62.md).

## Etap 0.63 — wdrożony

Stocznia polowa przy Marsie, opcjonalny rozkaz Zatrzymaj produkcję. Posiłki do czterech żywych jednostek, fizycznie niszczalny rdzeń, trwałe wyłączenie po raporcie. Format kampanii 40 i dziennika 19. [Zakres i weryfikacja](implementation-v0.63.md).

## Etap 0.64 — wdrożony

Hangar dronów strażniczych Satuk 15, trzy sojusznicze patrole na orbicie, lokalne wykrywanie i rzeczywisty ostrzał, naprawa w hangarze oraz płatna odbudowa u wolnego mechanika. Kadłub i opłacona odbudowa pozostają zapisane także po stracie statku. Format kampanii 41 i dziennika 19, bez migracji. [Zakres i weryfikacja](implementation-v0.64.md).

## Etap 0.65 — wdrożony

Przechwytujący, Pancernik, Serwisant i stawiacz min; mieszane składy stoczni, poligon Oddział mieszany, leczenie sojuszników, wachlarz salwy i miny z fizycznym rozbrajaniem. Format kampanii 41 i dziennika 19 bez zmian. [Zakres i weryfikacja](implementation-v0.65.md).

## Etap 0.66 — wdrożony

Trzy mieszane fale obrony placówek, rzeczywiste podejścia spoza bieżącej kamery i brak sztucznych wskaźników kierunku. Sprzątanie wyłącznie min danej obrony po jej rozstrzygnięciu lub przerwaniu. Większe składy: Księżyc 6, Wenus 6, Mars 9. [Zakres i weryfikacja](implementation-v0.66.md).

## Etap 0.67 — wdrożony

Dwie minigry terminali: obracane obwody włamania i zachowanie bilansu energii przy przekierowaniu zasilania skanera. Czas działa razem ze światem, błędy zostawiają ślad, alarm sprowadza rzeczywistych strażników, przerwanie pozwala ponowić próbę. Sokół: dłuższe okno i mniej śladu; Feniks: natychmiastowe, głośne przełamanie. Stare liczniki E/G usunięte; kampania 41 i dziennik 19 bez nowych pól. [Zakres i weryfikacja](implementation-v0.67.md).

## Etap 0.68 — wdrożony

Spójny pakiet Merkurego, przemysłu i Satuk 15: sześć odpornych złóż wyrywanych Harpunem, osobna osłonięta odnoga sektora, trzy nowe zasoby, dwie receptury, zadanie Osłona kinetyczna Satuk 15, tarcza I–II (1000/1150 m) i dwa wzmocnione magazyny (+400 każdy). Format kampanii 42 i dziennika 20 bez migracji. Podstawowa ścieżka aktu IV nie wymaga dodatkowej inwestycji. [Zakres i weryfikacja](implementation-v0.68.md).

## Aktualizacja 0.80 — eksploracja

Wdrożono dryf wszystkich asteroid orbitalnych, recykling poza krawędziami, nieregularne pola, nowy wrak, okrągłe zasoby i kolorowy ładunek, przełącznik zbierania/wyrzucanie, montaż hipernapędu I–III i produkcję z H, celownik oraz ograniczenie narzędzi kursorem. Pierwsza sieć magnetyczna działa przy Ziemi z dodatkowymi przekaźnikami. Następne: strefy generowane przez wrogie/obce statki i skażenia w dalszych sektorach, badania wydajności paliwa, balans tras i ekonomii wodoru. Szczegóły: implementation-v0.80.md.
