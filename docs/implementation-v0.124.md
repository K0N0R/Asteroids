# 0.124 — poprawki oprawy i przelotów aktu II

- Powierzchnia Fobosa korzysta z tego samego rysunku, palety i cieniowania co księżyc na orbicie. Usunięto dodatkowy ciemnoszary tint gruntu.
- Anomalie nie są rysowane na radarze. Pozostają widoczne w świecie i zachowują dotychczasowe spowolnienie oraz obrażenia.
- Szczegółowa ilustracja anomalii jest przygotowywana wokół kamery, zamiast rozciągania miniatury na cały sektor. Włókna mają stałą gęstość i globalne współrzędne, więc przesuwanie okna nie przestawia wzoru. Zachowano wspólną maskę z miękką granicą. Dodano ostrzejsze rdzenie włókien i drobiny. Dotyczy to Marsa oraz misji ratunkowej przy Jowiszu.
- Okno grafiki ma maksymalnie 3072 piksele na dłuższym boku; cache CPU najwyżej dwa obrazy i 12 mln pikseli. Wymiana okna niszczy poprzednią teksturę GPU. Okno ma zapas poza ekranem, dlatego nie jest przebudowywane co klatkę. Podczas tranzytu grafika anomalii jest ukryta i nie jest regenerowana w pustej przestrzeni między mapami.
- Przelot śluzą po dotychczasowym ładowaniu trwa 2.4 s. Statek i hol poruszają się ciągle pomiędzy pozycjami, z przyspieszeniem i wyhamowaniem, przy istniejącej oprawie hipernapędu. Granice map, kolizje i anomalie nie uszkadzają statku podczas przelotu. Bieżący obszar zmienia się po dotarciu do końca trasy.
- Zasięg rysowania skał uwzględnia ich promień i dodatkowy zapas, więc duża asteroida nie znika, kiedy jej środek opuści ekran.
- Kepler powstaje dopiero po odblokowaniu misji ekspedycji naukowej i przed jej zakończeniem. Odblokowanie podczas wyprawy również tworzy jednostkę i jej widok; wcześniejsze etapy nie mają fizycznego statku ani jego znaczników. Sprzątanie obejmuje również przygotowane, ale niepodłączone widoki badawcze.

## Weryfikacja

77 testów w 12 pakietach przechodzi. Nowe testy sprawdzają ciągłość drogi w trakcie transferu, czas przelotu i brak Keplera przed odblokowaniem misji oraz jego pojawienie się bez restartu wyprawy. Istniejący test zachowania kadłuba przez śluzę sprawdza również ochronę przed promieniowaniem w przestrzeni pomiędzy mapami. Pozostałe pakiety obejmują Marsa, labirynt, hipernapęd, ratunek jowiszowy, grafikę, sprzątanie, receptury i ładownie.

ESLint zmienionych plików, kontrola typów i build przechodzą. W podglądzie przeglądarkowym sprawdzono szczegóły anomalii, radar, powierzchnię i orbitę Fobosa oraz rzeczywisty przelot śluzą. Pierwsze przygotowanie szczegółowego okna anomalii zajęło około 19 ms. Dwanaście kolejnych utworzeń i zwolnień scen zachowało ograniczony cache (w tej próbie 6 743 040 pikseli). Ten test nie zastępuje wielogodzinnego profilu pamięci.
