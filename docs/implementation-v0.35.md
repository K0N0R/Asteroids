# Wersja 0.35 — wyposażenie kadłubów i czytelny hangar

## Hangar i stocznia

Panel statku ma dwa widoki: Parametry i Ulepszenia. Tarcza ma osobną ikonę, dużą wartość pojemności oraz regenerację, obok kadłuba i ładowni. Pozostałe parametry mają stały układ.

Stocznia pokazuje sześć dostępnych modułów każdego kadłuba, ich działanie i koszt poziomu I. Przełącznik Bazowy / Moduły III porównuje wygląd wyposażenia. To wyłącznie podgląd: zakup nadal daje bazowy kadłub, nie pobiera kosztów modułów ani nie modyfikuje posiadanej floty.

## Wygląd

- Aegis nie ma okrągłego podkładu. Sylwetkę tworzą osobne płyty pancerza.
- Widmo ma szersze skrzydła z krawędziami ostrzy i dopasowaną szerokość kolizji.
- Silniki mają kolejne stopnie obudów, dysz i żebrowania.
- Dysze manewrowe korzystają z mocowań danego kadłuba; emitują płomień po stronie przeciwnej do aktualnego skrętu.
- Małe zbiorniki ładowni i wewnętrzne wzmocnienia korzystają z osobnych miejsc na każdym kadłubie. Dodatki Manty mieszczą się w jej pokładzie.
- Ulepszenia tarcz powiększają pierścień, poświatę i heksy; impuls Aegis rozszerza osłonę dodatkowo.
- Lasery wydobywcze i projektor Feniksa zmieniają długość lufy, odcień i wiązkę. Ogniwo Aegis zmienia działo, układ rakietowy rakiety, a system drona jego pancerz. Harpun ma osobne zmiany ramion i szczęk.
- Kamuflaż, amunicja i granaty nie dodają ozdób do kadłuba ani nie zmieniają wyglądu niezwiązanego z nimi lasera.

## Dash Widma

Statek obraca się w kierunku ataku. Zanikające, miękkie powidoki kadłuba pokazują szerokość i przebytą trasę ostrzy. Powidoki są nakładanymi sylwetkami; unikają przycinania filtra ekranowego przy obróconej kamerze w dużym świecie.

Napęd ostrzowy zajmuje dotychczasowy slot handling: na poziom daje +25% obrażeń, +10% dystansu przez zwiększenie prędkości i +15% szybkości odnowienia. Projektor kamuflażu w slocie drill przyspiesza wyłącznie odnowienie kamuflażu optycznego. Istniejące poziomy modułów pozostają zachowane; format zapisu pozostaje 18.

Skały otrzymują 12% siły bojowej dasha, raz na atak. Jeżeli przy końcu fazy kadłub nadal przecina przeszkodę lub przeciwnika, statek kontynuuje ruch w kierunku ataku do wolnego miejsca. Kolizje wracają po wyjściu całego kadłuba; statek nie wraca do pozycji sprzed dasha.

## Weryfikacja

283/283 testów, w tym testy przedłużenia fazy bez cofnięcia, obrotu i zanikających próbek, osłabionego wydobycia, niezależnych ulepszeń dasha, dysz, obrysu dodatków Manty, długości lasera i wielkości tarczy. Pełny zestaw obejmuje też długą symulację sektora. TypeScript, lint i build produkcyjny sprawdzone.

Kontrola przeglądarkowa na osobnym porcie 3001: parametry hangaru, moduły stoczni i podgląd III, galeria 14 kadłubów bazowych/ulepszonych oraz zatrzymana klatka rzeczywistego renderera misji podczas dasha. Zapis użytkownika na porcie 3000 nie był zmieniany. To kontrola funkcjonalna i wizualna; nie zastępuje sesji balansu ani pomiaru FPS.

## Korekta skrzydeł i dysz

Skrzydła Widma obrócono o 180° wraz z nakładkami pancerza, mocowaniami ładowni i krawędziami ostrzy; zawinięte końcówki wskazują dziób. Dysze manewrowe są miniaturami bazowej obudowy silnika, obróconymi na boki i rysowanymi pod kadłubem. Zachowują indywidualne mocowania oraz emisję po stronie przeciwnej do skrętu. Weryfikacja: 14 testów grafiki/efektów, TypeScript, lint, build oraz galeria podstawowych i ulepszonych kadłubów w przeglądarce.

## Segmentowe rozszerzenia ładowni

Dodatkowe zbiorniki korzystają ze wspólnego renderera bazowych zbiorników: zaokrąglonych obudów, cienia, obejm i refleksów. Każdy kadłub ma osobny układ trzech segmentów inspirowany referencjami użytkownika. Poziom modułu dodaje kolejne segmenty i powiększa zamontowane zbiorniki; poszczególne segmenty mają różne proporcje. Sokół otrzymał bazowy zbiornik z tyłu kadłuba i dopasowane skośne rozszerzenia. Manta ma segmenty pod pokładem, Mule boczne pod silnikami i centralny na końcu grzbietu, Atlas w przerwach pomiędzy kontenerami. Statystyki i ceny ładowni pozostają bez zmian. Kontrola: 14 testów grafiki/efektów, TypeScript, lint, build oraz galeria wszystkich kadłubów bazowych i z modułami III.

## Dziób i wyrzutnia Atlasa

Usunięto przedni zbiornik oraz dwie wystające osłony z dziobu Atlasa. Boczne kontenery pozostają. Wzmocnienia pancerza biegną wzdłuż środkowego kadłuba i odsłoniętej części dziobowej. Obrotowa, dwururowa wyrzutnia rakiet znajduje się pod pokładem na dziobie i celuje za kursorem niezależnie od kadłuba. Położenie mocowania i długość lufy są wspólne dla rysunku i fizycznego wylotu rakiety. Namierzanie i naprowadzanie rakiet oraz granaty pozostają bez zmian. Weryfikacja: 78 testów floty, uzbrojenia, efektów i zmian 0.34/0.35, TypeScript, lint, build oraz przeglądarkowy podgląd kadłuba bazowego, modułów III i celowania na bok.

## Lifting Aegis

Niebieskie panele podzielono na przednie i tylne wkładki mieszczące się wewnątrz jasnego poszycia. Usunięto boczne światła. Działko energetyczne ma nową zwartą obudowę, osłoniętą lufę i widoczne ogniwa poziomów ulepszenia zamiast wydłużanego niebieskiego prostokąta. Ulepszenia pancerza nie rysują linii przez wizjery: poziom I dodaje zewnętrzne płyty dziobowe, II kolejne płyty rufowe, III boczne osłony łączące. Wizjery pozostają odsłonięte; sylwetka nadal jest segmentowa. Statystyki bez zmian. Kontrola wizualna obejmuje kadłub bazowy i wszystkie trzy poziomy pancerza.

## Nowa sylwetka Widma

Widmo ma smukły, warstwowy kadłub, rozwidlony dziób i segmentowe zakrzywione ostrza inspirowane referencją. Obecny silnik rufowy zachowano. Trzy segmenty ładowni przeniesiono przed kokpit: środkowy poprzecznie, boczne ukośnie. Poziomy napędu ostrzowego powiększają skrzydła (+6% rozpiętości na poziom); wzmocnienia pancerza dopasowują się do ich kształtu. Szerokość trafień dasha i powidoki korzystają z tej samej skali. Weryfikacja: 80 testów floty, uzbrojenia, efektów i zmian 0.34/0.35, w tym wzrost geometrii i trafienie poza bazową rozpiętością; TypeScript, lint, build oraz porównanie kadłuba bazowego, pancerza III, ostrzy III i kompletu modułów w przeglądarce.

## Układ Harpuna i przedni zderzak

Usunięto przedni mały zbiornik, wizjer przesunięto do przedniej krawędzi, a środkowy bazowy zbiornik powiększono. Ulepszenia pancerza zastępują wewnętrzne linie przednim zderzakiem: poziom I dodaje segment środkowy, II dwa segmenty boczne, III zwiększa grubość i wysunięcie tych trzech segmentów. Ramiona i silniki zachowują dotychczasowe mocowania. Statystyki pozostają bez zmian. Kontrola: 80 testów, TypeScript, lint zmienionych plików, build i porównanie wariantu bazowego z poziomami pancerza w przeglądarce.

## Obrys Prospectora

Kadłub Prospectora otrzymał łagodnie spłaszczony dziób i rufę zamiast pełnej elipsy. Usunięto wewnętrzne linie i nakładki wzmocnień. Poziomy pancerza zwiększają szerokość jasnego obramowania kadłuba, zachowując odsłonięty wizjer i zbiorniki. Zmiana wizualna, bez zmiany statystyk. Weryfikacja: 16 testów grafiki/efektów, TypeScript, lint zmienionych plików, build i podgląd kolejnych poziomów pancerza w przeglądarce.
