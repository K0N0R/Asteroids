# 0.34 — odzysk technologii i specjalizacje floty

## Wraki przeciwników

Każdy dostarczony wrak nadal daje dotychczasowe materiały. Dodatkowo ma 30% szans na odbudowę: dron daje Raidera, ciężki przeciwnik Lancera. Odbudowa wymaga wolnego miejsca we flocie (limit sześciu razem ze statkiem na wyprawie). Oba przechwycone kadłuby mają własne parametry i oprawę; nie są sprzedawane w stoczni.

Jeżeli odbudowa nie nastąpi albo hangar jest pełny, wrak ulepsza losowy moduł losowego zadokowanego statku. Losowanie obejmuje moduły poniżej poziomu odblokowanego warsztatem, maksymalnie III. Aktywny statek nie jest modernizowany podczas lotu. Przy braku odpowiedniej rezerwy pozostaje nagroda materiałowa, z czytelną informacją w dostawie.

Wynik zależy od seeda sektora i identyfikatora wraku. Dziennik dostaw zabezpiecza przed podwójną wypłatą, a nowe kadłuby i ulepszenia pozostają w bazie również po późniejszej śmierci lub odświeżeniu. Informacja trafia do komunikatu dostawy oraz podsumowania wyprawy.

## Swift i Widmo

- Swift wraca na pierwszą stronę stoczni jako zwiadowca: jedno działko, jeden krótki laser, prędkość 520, dobry skręt, zakłócanie radarów 60%, cena 35 rudy / 2 komponenty, bez wymagania warsztatu.
- Widmo jest osobnym kadłubem warsztatu II na drugiej stronie stoczni. LPM uruchamia fazowy dash (0,32 s, 1600 m/s, 5 s odnowienia), PPM kamuflaż optyczny (3 s, 12 s odnowienia). Nie posiada działka ani lasera.
- Dash przechodzi przez kolizje, trafia każdego przeciwnika raz na użycie za 65 obrażeń i uszkadza ściany Aegis. Ściany mają 180 HP i po zniszczeniu znikają również z grafiki. Przytrzymanie LPM nie ponawia automatycznie zdolności. Jeśli faza skończyłaby się wewnątrz przeszkody, statek wraca do początku skoku.
- Pozostałe kadłuby mają pasywną statystykę „Zakłócanie radarów wroga”. Zmniejsza zasięg wykrycia przez statki AI, nie zmienia przezroczystości modelu i nie wymaga C. Optyczny skaner placówki wymaga osłony, sabotażu lub kamuflażu Widma; zakłócanie radarów nie wyłącza tego skanera.

W katalogu są teraz 12 kadłubów, a dodatkowe dwa można pozyskać wyłącznie z wraków.

## Alternatywne uzbrojenie

Każdy kadłub ma trzy montowane warianty. Zwykłe działka zachowują Autocannon, Impuls i Kinetic. Systemy specjalne otrzymują nazwane odpowiedniki: lasery górnicze, szczęki odzysku, ogniwo EMP, arsenał rakietowy, bateria skrzydłowa, projektor bojowy i napęd fazowy.

- Standard zachowuje parametry bazowe.
- Impulsowy: moc ×0,8, cykl uzbrojenia impulsowego ×0,7; wiązki i dash mają zasięg ×1,2.
- Ciężki: moc ×1,45, cykl ×1,4; wiązki i dash mają zasięg ×0,85.

Modyfikatory dotyczą realnej symulacji odpowiedniego systemu, a nie wyłącznie liczb w hangarze. Ciągłe lasery różnią się mocą i zasięgiem, szczęki mocą i tempem pracy, działa EMP i amunicja mocą oraz kadencją, rakiety i granaty mocą oraz odnowieniem, a dash siłą, długością i odnowieniem. Optyczny kamuflaż pozostaje osobnym systemem Widma. Zakup i swobodny montaż posiadanych wariantów odbywa się w bazie; wyposażenie jest przypisane do kadłuba i zachowywane przy odzysku.

## Załoga i grafika

Załoga pracuje wyłącznie w stacji. Usunięto wybór Pokład/Stacja oraz automatyczne naprawy i produkcję podczas lotu. Ręczne R i zestawy zabierane z bazy pozostają. Mule zachowuje wyjątkową natychmiastową produkcję zestawu na PPM. Strata statku nie zabija personelu bazy.

Ulepszenia są teraz wpuszczonymi panelami, wzmocnieniami, oznaczeniami ładowni i osprzętem silników wewnątrz geometrii kadłuba. Usunięto uniwersalny łuk pancerza i duże nakładki, które przecinały różne sylwetki. Wyposażenie korzysta z palety danego statku; warianty mają subtelne różnice osprzętu. Swift, Widmo i przechwycone statki mają rozróżnialne sylwetki.

Ściany Aegis mają 110 m grubości w fizyce i grafice. Każdy pocisk gracza dodatkowo sprawdza przeszkody między kadłubem a końcem lufy, także gdy długa lufa wystaje poza cienką przeszkodę.

## Zapis i weryfikacja

Format 18 migruje dawne `swift` do Widma, również w rezerwie i sygnałach ratunkowych. Nowo kupowany Swift ma własną tożsamość. Dawny personel pokładowy wraca do bazy bez utraty zatrudnienia, surowców ani zestawów. Polityka przegranej po odświeżeniu aktywnej misji pozostaje.

Testy obejmują migrację, odbudowę obu typów wraków, pełny hangar, modernizacje rezerw, utrwalenie nagród, unikalność Mule, pasywne zakłócanie radarów, warianty uzbrojenia, rzeczywiste obrażenia lasera, dash i ściany, zakończenie fazy wewnątrz przeszkody oraz strzelanie z długą lufą przy ścianie. Testy poprzedniej załogi pokładowej zastąpiono kontrolą personelu stacji zgodnie ze zmianą projektu.

Wynik: 277/277 testów pełnego zestawu, w tym 30 minut symulacji sektora i cykle lotu wszystkich 14 kadłubów. Po dopasowaniu wylotu pocisków Żądła do wybranego modelu lufy ponownie przeszło 66 testów floty i uzbrojenia. TypeScript, lint i build produkcyjny zakończone poprawnie.

Kontrola przeglądarkowa: galeria wszystkich kadłubów w wersji podstawowej i z modułami III, Swift na pierwszej stronie stoczni, Widmo na drugiej, panel załogi bez przydziału na pokład, warianty uzbrojenia oraz start wyprawy, cofanie i udane dokowanie. Podgląd działał na osobnym porcie 3001; test nie wymagał zmiany zapisu pod portem 3000. Nie jest to końcowa sesja balansu ani pomiar FPS.
