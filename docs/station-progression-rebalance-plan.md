# Plan: rozwój stacji i rebalans gospodarki

Stan: 2026-10-23. Plan powstał na podstawie 0.130.0; mechaniki wdrożono w roboczej wersji **0.131.0**. [Rzeczywisty zakres, wyniki prób i pozostałe prace](implementation-v0.131.md).

Ustalenia autora w sekcji 1 mają pierwszeństwo przed wcześniejszymi planami gospodarki i kampanii. Liczby, nowe materiały oraz terminy wyższych tierów w dalszych sekcjach są propozycją do pierwszego wdrożenia. Szczegóły statków, zdolności, sterowania F/Q/E oraz usunięcia Spacji i K: [plan floty i sterowania](fleet-progression-controls-plan.md).

## 1. Ustalenia autora

- Pierwszy quest na Ziemi to budowa Laboratorium z samych pierwiastków. Zastępuje „Pierwsze zaopatrzenie”.
- Laboratorium I udostępnia podstawowe istniejące procesy. Materiały z tych procesów pozwalają później zbudować Warsztat I.
- Quest Warsztatu pojawia się **po misji księżycowej**, jako przygotowanie do Marsa. Jego ukończenie otwiera tier I i produkcję wszystkich statków I.
- Misja księżycowa daje darmowego Muła, jeśli jednostka nie została zniszczona przez wrogów. Statek jest dostępny z Satuk 15.
- Laboratorium i Warsztat rozwijamy osobno w Rozbudowie stacji. Wyższe poziomy otwierają bardziej skomplikowane materiały i części.
- Usuwamy Oczyszczanie miedzi, Oczyszczanie krzemu, Przygotowanie tlenu i Przewodniki miedziane wraz z produktami pośrednimi.
- Wyższe tiery wymagają składników anomalii wydobywanych po zdobyciu technologii na Merkurym.
- Projekty statków odblokowuje dostępność ich tieru technologicznego, bez osobnych questów kadłubów. Tarcze Marsa nie dają Bastiona ani Manty.
- Prospector jest statkiem startowym/awaryjnym tieru 0. Nie podlega produkcji ani ulepszaniu.
- Rozbudowa stacji wymaga refaktoru widoku na wzór pozostałych przebudowanych ekranów.

## 2. Co trzeba zastąpić w obecnej implementacji

Obecnie `station.workshop: 0..2` steruje jednocześnie Laboratorium, Warsztatem, kadłubami i modułami. Podstawowe receptury działają na 0; pierwszy zakup zaplecza otwiera części II i moduły II. Dziennik wymaga go już na starcie.

Receptury II zużywają części I, a III zużywają II; napęd i zasilanie dodatkowo wymagają innych gotowych części. To mnoży produkcję pośrednią. Dzisiejsze `tier = HULLS[hull].workshop + 1` nie odpowiada nowemu podziałowi statków.

Obecna paczka księżycowa wymaga produkowanych części I. Przy Warsztacie dopiero po Księżycu tworzyłoby to zamkniętą zależność. **Pierwszą misję księżycową trzeba przebudować razem ze startem gospodarki.** Nie wystarczy przesunąć quest Warsztatu.

## 3. Progresja i kolejność

| Etap | Dostępne zakłady | Rezultat |
| --- | --- | --- |
| Początek aktu I | Brak zakładów; Prospector 0 | Wydobycie pierwiastków do Laboratorium |
| Pierwszy quest Ziemi | Laboratorium I | Podstawowe materiały; nadal bez produkcji części i statków |
| Misja księżycowa | Laboratorium I | Dostawy materiałów, działania przy placówce, obrona i możliwy darmowy Muł |
| Po zakończeniu misji księżycowej | Laboratorium I → Warsztat I | Otwarcie części I i wszystkich pięciu projektów I; przygotowanie do Marsa |
| Mars i Wenus, akty II–III | Zakłady I | Rozwój floty I, tarcze, przygotowanie wyprawy na Merkurego |
| Koniec aktu IV, Merkury | Zakłady I i nowa technologia | Adapter wydobycia anomalii z części I, pierwsza dostawa urobku |
| Po Merkurym, przed bazą aktu V | Laboratorium II → Warsztat II | Materiały i części II, Sokół/Widmo/Atlas |
| Akty V–VII | Zakłady II | Baza Marsa, przejście pasa, badania Jowisza |
| Po pakiecie badawczym Jowisza | Laboratorium III → Warsztat III | Materiały i części III, Aegis/Żądło/Feniks |
| Akty VIII–X | Zakłady III | Rozwój floty do finału |

**Propozycja:** II po Merkurym, III po Jowiszu. Wszystkie obowiązkowe cele przed Merkurym są osiągalne na I; misję księżycową można ukończyć samym Prospectorem 0. Badania odblokowujące III są osiągalne na II.

Osobny stan zakładów: `laboratoryLevel: 0..3`, `workshopLevel: 0..3`. Zero oznacza brak zakładu; I jest pierwszym tierem. Otwarcie pełnego tieru części następuje po montażu Warsztatu danego poziomu. Laboratorium wyższego poziomu udostępnia jego materiały wcześniej, potrzebne do zbudowania Warsztatu.

## 4. Nowy początek aktu I i Księżyc

Proponowany przebieg usuwa obowiązek produkcji części przed Warsztatem:

1. **„Uruchom Laboratorium”**: 8 Fe + 2 Cu + 2 Si. Montaż w Rozbudowie stacji, bez jakiejkolwiek gotowej części. Odblokowuje wodę, krzemionkę, stal i stop Al–Mg.
2. Kontakt z ziemskim satelitą, dolot do Księżyca i odczyt sondy zachowują role eksploracyjne. Kontakt może pozostać równoległy do pierwszych dostaw; dalszy etap księżycowy wymaga Laboratorium I.
3. **Wyposażenie placówki przed Warsztatem:** zastępujemy obecną paczkę 19 gotowych części dostawą **8 stali + 4 krzemionki + 2 wody**. Materiały jadą w trwałej paczce na holu, pakowanej z magazynu Satuk 15. Strata nie pobiera ponownie kosztu: istniejącą paczkę trzeba odzyskać.
4. Propozycja fabularnego uzasadnienia: na miejscu są prefabrykaty i instalacje wymagające uruchomienia; gracz dostarcza materiały montażowe i eksploatacyjne. Nie wytwarza ręcznie elektroniki bez Warsztatu.
5. Dostawa uruchamia miejscowe Laboratorium I i Muła AI pomagającego przy rozbudowie. Proponowany dalszy manifest: **80 Fe + 4 C**, zamiast obecnego wymogu 160 Fe + 2 C. Dostawy są częściowe; da się je ukończyć także po stracie Muła, samym Prospectorem.
6. Odbiór i obrona zamykają pierwszą misję księżycową. Trzeba dopasować obronę do Prospectora bez ulepszeń: zapewnić wsparcie placówki, czytelne fale i możliwość ponowienia. Utrata pomocniczego Muła nie blokuje zwycięstwa ani Marsa.
7. Jeśli Muł przetrwał, po zakończeniu misji trafia **raz** do hangaru Satuk 15. To nagroda w postaci istniejącego statku, nie wcześniejsze otwarcie projektu ani fabryki. Stan `active / destroyed / transferred` jest trwały; restart i ponowienie obrony nie odtwarzają utraconej nagrody.
8. **„Uruchom Warsztat”** pojawia się po zakończeniu misji księżycowej, także gdy Muł zginął. Koszt: **4 stali + 2 krzemionki + 2 Cu**. Montaż otwiera części i wszystkie projekty I. Dalsza droga do Marsa wymaga tego przygotowania.

Darmowego Muła można wybrać w Satuk 15 po jego przyznaniu. Projekt zakupu i ulepszenia pozostają zależne od Warsztatu. Nie płacimy za statek nagrody; gracz, który go stracił, po uruchomieniu Warsztatu może wyprodukować nowego lub wybrać inny projekt I.

Początkowy Prospector ma działające narzędzia, magazyn, możliwość dokowania i podstawowe interakcje. Jego brak przepisu nie może blokować procedury awaryjnej: gdy nie ma żadnego dostępnego statku, gracz dostaje jednego Prospectora 0 bez sprawdzania, czy stać go na dawny przepis.

Na Księżycu przed Warsztatem Satuk 15 nie działa miejscowa produkcja części. Lokalne Laboratorium może przetwarzać materiały. Dla tej wersji planu miejscowy Warsztat I uruchamia się dopiero po pierwszym Warsztacie Satuk 15, na bazie już dostarczonych prefabrykatów, bez ponownego żądania usuniętej paczki części. Lokalne zakłady II–III są poza tą paczką.

## 5. Materiały i uproszczenia

Usuwane produkty: `pureCopper`, `pureSilicon`, `oxygenGas`, `conductors`. Miedź, krzem i tlen trafiają bezpośrednio do receptur. Formowanie przewodów i przygotowanie gazu są czynnością produkcji urządzenia, bez osobnego przedmiotu oraz kliknięcia.

Ilości oznaczają porcje magazynowe gry, nie kilogramy. Modele rzeczywistych materiałów nadal pokazują poprawny skład i warunki procesu; magazynowy O oznacza dostępny surowiec tlenowy. Nie sugerujemy przechowywania swobodnych atomów tlenu. Stop i stal mają umowne porcje materiału, bez udawania jednej cząsteczki.

| Zakład | Produkt | Wejście jednej operacji | Wynik |
| --- | --- | --- | --- |
| Laboratorium I | Woda | 4 H + 2 O | 2 wody |
| Laboratorium I | Krzemionka | 4 Si + 8 O | 4 krzemionki |
| Laboratorium I | Stal | 4 Fe + 1 C | 4 stali |
| Laboratorium I | Stop Al–Mg | 4 Al + 1 Mg | 4 stopu |
| Laboratorium II | Węglik krzemu (SiC) | 4 Si + 4 C | 4 SiC |
| Laboratorium II | Ceramika tlenkowa (Al₂O₃) | 8 Al + 12 O | 4 ceramiki |
| Laboratorium II | Stabilizowany materiał anomalii (MA) | 4 urobku anomalii + 4 krzemionki | 4 MA |
| Laboratorium III | Kompozyt rezonansowy (KR) | 4 MA + 2 SiC | 2 KR |

MA i KR to robocze nazwy fikcyjnej technologii, nie nowe pierwiastki ani rzeczywiste reakcje chemiczne. Mają osobną kategorię i bilans składników osnowy. Nie wymagają dokładania drugiej rzadkiej odmiany urobku.

Woda i krzemionka mają większą stałą porcję niż obecnie; stop daje 4 zamiast 1 porcji. To świadoma zmiana balansu. Jedna operacja nadal wykonuje jedną recepturę: np. „Wytwórz 4 krzemionki”. Nie przywracamy produkcji w tle ani przycisków 1/5/10/maks. Nadwyżki zostają w magazynie, a UI jasno pokazuje wynik i koszt całej porcji.

## 6. Wszystkie receptury części

Każdy wpis daje **jedną część**. Zachowujemy sześć rodzin i lekkie poszycie jako wariant rodziny poszycia: razem 21 receptur. Wyższe części proponuję wykonywać bezpośrednio z materiałów, bez zużywania poprzedniego tieru ani innych gotowych części. Konstrukcje, statki i wyposażenie nadal składają się z części.

| Część | I — Warsztat I | II — Warsztat II | III — Warsztat III |
| --- | --- | --- | --- |
| Poszycie stalowe | 1 stal | 2 stal + 1 SiC + 1 MA | 3 stal + 2 SiC + 1 ceramika + 1 KR |
| Poszycie lekkie | 1 stop Al–Mg | 2 stop Al–Mg + 1 ceramika + 1 MA | 3 stop Al–Mg + 1 SiC + 2 ceramika + 1 KR |
| Elektronika | 1 Si + 2 Cu + 1 krzemionka | 2 Si + 2 Cu + 1 SiC + 1 MA | 3 Si + 3 Cu + 1 SiC + 1 ceramika + 1 KR |
| Maszyneria | 2 stal + 1 Cu | 3 stal + 1 stop Al–Mg + 1 MA | 4 stal + 2 stop Al–Mg + 1 SiC + 1 KR |
| Podtrzymywanie życia | 1 stal + 1 woda + 2 O | 1 stal + 2 woda + 2 O + 1 ceramika + 1 MA | 2 stal + 2 woda + 3 O + 2 ceramika + 1 KR |
| Zespół napędowy | 2 stal + 1 Cu + 1 Si | 2 stal + 1 stop Al–Mg + 2 Cu + 1 SiC + 1 MA | 3 stop Al–Mg + 2 stal + 2 Cu + 2 SiC + 1 KR |
| Układ zasilania | 1 stal + 2 Cu + 1 krzemionka | 3 Cu + 1 Si + 1 ceramika + 1 MA | 4 Cu + 2 Si + 2 ceramika + 1 KR |

Każda część II zawiera 1 porcję urobku przez MA, a III — 2 przez KR. Maksymalnie pięć rodzajów składników na część. Starsze części pozostają przydatne do budowy wcześniejszych statków i urządzeń; nie wprowadzamy automatycznej wymiany tieru kadłuba.

| Pozostały produkt | Wejście | Wynik i warunek |
| --- | --- | --- |
| Zestaw naprawczy | 1 stal + 1 Cu | 1 zestaw; Warsztat I; dotychczasowy limit zestawów |
| Płyta kinetyczna | 2 Ti + 1 stal + 1 SiC | 1 płyta; Warsztat II i technologia Merkurego |
| Moduł osłonowy | 2 płyty kinetyczne + 1 układ zasilania II | 1 moduł; Warsztat II |

Płyty i moduł są specjalistycznym wyposażeniem obecnej ochrony stacji; nie dopisujemy im trzech tierów. Nie są potrzebne do pierwszej ekstrakcji. Zestaw naprawczy nie wymaga osobnego poszycia, a Muł zachowuje samonaprawę bez zasobów.

## 7. Koszty zakładów i blokady fabularne

PS, M, E i Z oznaczają poszycie stalowe, maszynerię, elektronikę i układ zasilania. Każdy wiersz jest jednorazowym kosztem danego montażu, bez wcześniejszych poziomów.

| Zakład | Koszt | Wszystkie warunki |
| --- | --- | --- |
| Laboratorium I | 8 Fe + 2 Cu + 2 Si | Pierwszy quest Ziemi, poziom 0 |
| Warsztat I | 4 stal + 2 krzemionka + 2 Cu | Laboratorium I i zakończona misja księżycowa, Warsztat 0 |
| Laboratorium II | 6 PS I + 2 M I + 2 E I + 1 Z I + 2 krzemionka + 2 stop Al–Mg + 2 urobek | Zakłady I, przeanalizowane `mercury-technology`, adapter i pierwsza dostawa urobku |
| Warsztat II | 8 PS I + 4 M I + 3 E I + 2 Z I + 2 ceramika + 4 MA | Warsztat I i Laboratorium II |
| Laboratorium III | 6 PS II + 3 M II + 3 E II + 2 Z II + 4 MA + 4 SiC | Zakłady II i analiza `jupiter-observations` |
| Warsztat III | 8 PS II + 4 M II + 4 E II + 3 Z II + 4 KR + 4 ceramika | Warsztat II i Laboratorium III |

Laboratorium II przyjmuje surowy urobek do komory, więc nie wymaga własnego przyszłego produktu. Warsztat II powstaje z części I i materiałów Laboratorium II. III analogicznie korzysta z części II. Żaden zakup nie wymaga części, które sam dopiero otworzy.

Wyższy poziom zachowuje niższe receptury. Warsztat nie przekracza poziomu Laboratorium. Ulepszenie Laboratorium wymaga Warsztatu poprzedniego poziomu. Koszty i warunki muszą być wspólne dla UI oraz funkcji wykonującej zakup.

## 8. Pierwsza ekstrakcja anomalii

Wydobycie jest niezbędną częścią wydania tieru II; nie można włączyć kosztów i odłożyć źródeł urobku na później.

1. Zabezpieczenie i analiza `mercury-technology` otwierają projekt adaptera ekstrakcyjnego. Analiza bez dodatkowej opłaty; to potwierdzenie zdobytej wiedzy.
2. Adapter stacji kosztuje **2 PS I + 1 M I + 1 E I + 1 Z I** i otwiera tryb ekstrakcji narzędzi statków wydobywczych tieru I lub wyższego. Swift, Muł i Harpun umożliwiają pierwszy urobek. **Prospector 0 nie otrzymuje adaptera ani nowej zdolności**; Manta bez lasera nie staje się górnikiem.
3. Nawigacja wskazuje dostępny brzeg anomalii na Marsie. Próbka nie wymaga bazy aktu V, części II, III ani wejścia w pole obrażeń. Również gracz bez darmowego Muła ma produkowalnego Swifta I.
4. Aktywna operacja wydobywcza daje 4 porcje urobku do ładowni; dostawa do Satuk 15 zalicza pierwszą próbkę. Utrata ładunku pozwala ponowić wyprawę.
5. Proponowana podaż: trzy punkty brzegowe po 32 porcje, razem **96** na wyprawę. Wyczerpane zasoby odnawiają się przy następnym wylocie; gracz musi aktywnie wydobywać i przewozić urobek. Odnowa zasobu nie resetuje misji ani przebiegu korytarzy. To propozycja strojenia, nie wcześniejsze ustalenie autora.

Oba zakłady II zużywają łącznie 6 porcji urobku: 2 surowego i 4 przez MA. Pierwsza dostawa 8 wystarcza na rozruch. Dalsza podaż finansuje części floty i bazę Marsa.

Dowolne wycinanie i zapisywanie nowych korytarzy pozostaje powiązanym projektem technologii z Merkurego. Pierwsze punkty ekstrakcji działają na dostępnych brzegach bez konieczności ukończenia całej deformacji geometrii. Wydobycie nie daje automatycznej odporności na skażenie. Szczegóły szerokości swobodnie wycinanych przejść wymagają osobnego projektu.

## 9. Inne projekty stacji i budowle

| Projekt | Koszt | Warunek |
| --- | --- | --- |
| Tarcza podstawowa | 6 PS I + 2 M I + 3 E I + 3 Z I | Warsztat I, początek aktu II; nadal realizuje cel tarcz, bez nagrody w postaci projektów statków |
| Hangar dronów | 9 PS I + 3 M I + 3 E I + 3 napęd I + 3 Z I | Warsztat I i zakończona misja księżycowa; opcjonalny |
| Odbudowa drona | 2 PS I + 1 E I + 1 napęd I + 1 Z I | Zbudowany hangar |
| Adapter ekstrakcyjny | 2 PS I + 1 M I + 1 E I + 1 Z I | Warsztat I i technologia Merkurego |
| Osłona kinetyczna I | 1 moduł osłonowy + 4 PS II + 2 E II + 2 Z II | Tarcza podstawowa, Warsztat II, technologia Merkurego |
| Osłona kinetyczna II | 2 moduły osłonowe + 6 PS II + 3 E II + 3 Z II | Osłona I, Warsztat II, obrona bazy Marsa i zabezpieczony korytarz |

Osłony kinetyczne nie blokują zdobycia technologii ani pierwszej ekstrakcji. Ich poziom urządzenia nie oznacza dodatkowego tieru gospodarki. Nie wracają płatne magazyny, pracownicy ani produkcja podczas lotu.

- Placówka Wenus: 8 PS I + 4 M I + 3 E I + 3 Z I + 3 podtrzymywanie życia I.
- Osłona słoneczna Wenus: 6 poszycie lekkie I + 3 Z I + 2 E I.
- Baza Marsa w akcie V: **12 PS II + 6 M II + 4 E II + 4 Z II + 4 podtrzymywanie życia II**. To pierwsza obowiązkowa budowla II. Dostęp do wydobycia anomalii nie zależy od tej bazy.
- Przejrzeć dostawy i nagrody aktów V–X. Badania Jowisza otwierające III nie mogą wymagać materiałów ani statków III.

## 10. Budżety po zmianie misji księżycowej

Rozwinięto graf od pustego magazynu, z pełnymi porcjami i współdzieleniem nadwyżek w każdym pakiecie. Operacje to uruchomienia receptur, bez nawigacji UI i montażu zakładów. Liczby nie odejmują nagród ani odzysku. Urobek anomalii wliczamy do sumy porcji, ale pozostaje osobnym surowcem.

| Pakiet | Łączne porcje wejściowe | Operacje |
| --- | --- | --- |
| Samo Laboratorium I | 12 | 0 |
| Materiały w paczce księżycowej | 28 | 4 |
| Laboratorium I + paczka + 80 Fe i 4 C do placówki | 124 | 4 |
| Powyższe + Warsztat I po misji | 143 | 6 |
| Powyższe + Swift I i 2 dodatkowe zestawy naprawcze | **198** | **24** |
| Budowa Swifta I osobno | 48 | 15 |
| Budowa Muła I osobno, jeśli nagroda przepadła | 103 | 39 |
| Laboratorium II i Warsztat II, bez poprzednich poziomów i adaptera | 146, w tym 6 urobku | 43 |
| Laboratorium III i Warsztat III, bez poprzednich poziomów | 439, w tym 48 urobku | 85 |
| Oba zakłady II + baza Marsa V | 470, w tym 38 urobku | 111 |

Suma pierwszego pełnego pakietu z zakupem Swifta i dwoma zestawami to **116 Fe + 11 C + 15 Cu + 18 Si + 30 O + 8 H = 198**. Pozostają 3 stali, 3 krzemionki i 1 woda. To budżet kilku etapów, nie jedna wyprawa ani koszt pierwszego questa. Przy ocalonym Mule część transportów wykona większa ładownia, ale test przejścia nie może zakładać tej nagrody.

Budżet samych zakładów I bez misji księżycowej to nadal 31 porcji i 2 operacje; nie oznacza to ich równoczesnego otwarcia na początku. Koszt technologii i czas fabularnego odblokowania są osobnymi warunkami.

Poprzednie porównanie paczki z gotowych części (64 → 27 operacji) oraz budowy Prospectora (40 → 15) było analizą przed dodatkowymi ustaleniami autora. **Nie jest docelowym flow:** paczka zawiera teraz materiały, a Prospector nie ma przepisu.

Kryteria podaży i strojenia:

- Pierwsza orbita zapewnia co najmniej dwukrotność każdego składnika Laboratorium I, bez śluz i losowych łupów.
- H i źródła pozostałych materiałów księżycowych dostępne przed dostawą na powierzchnię. Nie wymagamy Warsztatu ani Muła do zdobycia potrzebnego składnika.
- Cały akt I zapewnia co najmniej dwukrotność każdego składnika pakietu 198 oraz rezerwę obrony; nagrody i odzysk przyspieszają, ale nie są warunkiem.
- Przed Fobosem dostępne są materiały na tarczę, dwa odtworzenia **wybranego produkowalnego statku I** i naprawy. Usunąć z testów budżetu Marsa założenie budowania dwóch Prospectorów.
- Al/Mg dostępne przed lekkimi projektami i osłoną Wenus. Ti oraz ceramika II nie są potrzebne do samej wyprawy po technologię Merkurego.
- Bezpieczna pula 96 urobku daje ponad dwukrotność 38 potrzebnych na zakłady II i bazę Marsa; pełna rezerwa musi uwzględnić też adapter i wybraną flotę.
- Zakłady II mieszczą się docelowo w 45 operacjach, III w 90. Mierzyć także liczbę zmian zakładki i rzeczywisty czas produkcji.
- Koszt konfiguracji II celujemy w około 2–3 razy, III w 4–6 razy koszt reprezentatywnej konfiguracji I. To cel do walidacji pełnych kadłubów i modułów, nie gwarantowany wynik samych tabel.

## 11. Refaktor Rozbudowy stacji

Widok należy wydzielić z dużej metody `lobby.ts` do osobnego modułu z własnym stanem nawigacji, analogicznie do Hangaru. Wspólny katalog projektów opisuje poziom, warunek, koszt i listę efektów. Ekran i zakup korzystają z tego samego wyniku oceny projektu.

Proponowany układ:

| Obszar | Zawartość |
| --- | --- |
| Lewa lista | Laboratorium, Warsztat, Tarcze, Drony, Ekstrakcja; ikona, bieżący poziom, stan dostępności |
| Środek | Ilustracja wybranego urządzenia i przełącznik podglądu poziomów I/II/III |
| Prawy panel | Obecnie → po montażu, konkretne receptury/projekty, oddzielny wymóg fabularny i karty składników magazyn/wymóg |
| Stały dół panelu | Jeden przycisk montażu, koszt wybranego kroku, czytelna przyczyna blokady |

Każdy projekt ma osobny ekran szczegółów; nie ściskamy trzech zakładów i całej gospodarki w jeden panel. „Stwórz” przy składniku prowadzi do jego receptury i wraca do wybranego projektu/poziomu. Przy pierwiastku wskazuje źródło wydobycia. Zachowujemy wybór po produkcji i odświeżeniu widoku. Podgląd przyszłego poziomu nie umożliwia pominięcia poprzedniego.

Laboratorium i Warsztat na 0 pokazują odnośnik do montażu. Warsztat przed Księżycem wyjaśnia, kiedy pojawi się zadanie; nie przyjmuje przedwczesnej płatności. Wyższe projekty oraz materiały anomalii ujawniamy po odpowiednim odkryciu, bez zapełniania początkowego HUD nieosiągalnymi kosztami.

Nie używamy ogólnego „zaplecze I/II” jako nazwy dwóch różnych urządzeń. Lista efektów informuje „części II i trzy projekty statków II”, a nie niejasne „wyższa technologia”.

## 12. Wdrożenie i kryteria odbioru

1. Model danych, katalog projektów, osobne poziomy i nowy zapis. Przy wdrożeniu wybrać kolejne wolne wersje kampanii/dziennika; zgodnie z polityką projektu stare formaty oznaczają nową kampanię, bez migracji.
2. Start Laboratorium, receptury I, księżycowa paczka materiałów, Muł AI z trwałym losem i nagrodą, obrona oraz późniejszy Warsztat. W tej samej całości usunąć wymagania części przed ich produkcją.
3. Wszystkie projekty floty zależne od tieru, zakaz produkcji/ulepszeń Prospectora, moduły i nowy ekran stacji. Usunąć odblokowania floty z questów, w tym tarcz Marsa.
4. Sterowanie oraz nowe role statków I, szczególnie Manta/EMP/wielohol i interakcje F. Misje I–IV muszą działać bez przyszłych zdolności II/III.
5. Technologia Merkurego, ekstrakcja, zakłady i części II, trzy statki II oraz baza Marsa jako jedna grywalna całość. Nie publikować kosztów II bez źródła urobku.
6. Analiza Jowisza, zakłady i części III oraz trzy statki III. Następnie pełne przejście, strojenie walk i ekonomii.

Kontrole wymagane po implementacji:

- Acykliczny graf każdej obowiązkowej konstrukcji i misji; surowce dostępne przed blokującym zakupem.
- Nowy start 0/0 → Laboratorium I → misja księżycowa → Warsztat I; przed Księżycem brak produkcji części, po nim wszystkie projekty I.
- Dwa warianty misji księżycowej: Muł przeżył / zginął. W obu można dojść do Warsztatu i Marsa. Nagroda występuje najwyżej raz; nie wraca po odświeżeniu lub ponowieniu walki.
- Zakłady II zablokowane do technologii Merkurego i pierwszej dostawy; III do analizy Jowisza. Zapas surowców ani wrak nie omija warunku.
- Wszystkie 21 części produkowalne na właściwym poziomie. Pobranie pełnych kosztów atomowe; brak materiału nie zmienia magazynu.
- Brak czterech usuniętych produktów w recepturach, nagrodach, łupach, ikonach kosztów i nawigacji.
- Odtworzenie budżetów sekcji 10 z pełnymi porcjami i resztkami. Koszt anomalii raportowany osobno.
- Utrata pierwszej próbki nie blokuje nowej ekstrakcji. Prospector nie dostaje nowego modułu; źródło osiągalne Swiftem I także bez darmowego Muła.
- Recykling zgodny z rzeczywistym składem kadłuba/modułów; brak zysku z darmowego Prospectora. Przed otwarciem Warsztatu łupy nie zastępują konstrukcji wymagającej niedostępnych urządzeń.
- Lokalne zakłady Księżyca nie dziedziczą automatycznie II/III Satuk 15. Magazyny nie mieszają stanów.
- Pełne przejście do Merkurego na I i do raportu Jowisza na II; początek Księżyca na nieulepszonym Prospectorze. Próby obejmują straty statków i brak opcjonalnych nagród.
- Refaktor UI: poprawne karty kosztów, powrót z receptury, zachowany wybór, odświeżanie dostępności i brak podwójnej płatności. Testy gospodarki/kampanii/odzysku, kontrola typów i build.

Miejsca zmian: `frontend/game/state/{campaign,chemistry,advancedRecipes,resources,production,stationConstruction,story,lunarConstruction,lunarShipment,fleetConstruction,fleetUnlocks,equipmentCosts,stationShield,stationDrones,kineticIndustry,orbitalConstruction}.ts`, konfiguracja statków, instruktor/dialogi oraz widoki `lobby`, `hangar` i `lunarStation`. Wydobycie i zdolności wymagają też zmian symulacji, inputu, fizyki i zapisu; zakres opisuje dokument floty.

Budżety zostały obliczone z proponowanych receptur. Nie zastępują prób czasu wydobycia, trudności walk i wygody produkcji, które będą możliwe po implementacji.
