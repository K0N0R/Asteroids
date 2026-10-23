# 0.127 — Akt II: przejścia, anomalia, testowanie i utrata startera

Moduł pamięci pozostaje wymaganym fizycznym ładunkiem do Satuk 15. Wraki statków i wyłączone drony są opcjonalne. Poprawiono dobór celu HUD: po neutralizacji instalacji wymagany moduł ma pierwszeństwo przed bliższym wrakiem; etykiety i komunikaty rozróżniają te obiekty. Zabezpieczenie sektora sprawdza zneutralizowane instalacje i patrole, bez dostawy wraków statków.

Podczas przelotu śluzą widoczne są przestrzennie obiekty obu końców trasy. Anomalia nie jest ukrywana na czas przelotu, cel jest przygotowywany już podczas ładowania, a radar interpoluje środek i promień między mapami. Mars i Fobos mają trwałe obiekty graficzne, zamiast ponownego tworzenia planet po każdej śluzie.

Labirynt korzysta z interpolowanych krzywych i zmiennej szerokości przejść, połączonych odnóg oraz wolnych polan. Geometrię granicy tworzy interpolowane pole, zamiast prostokątnych pasów. To samo pole służy do testowania zagrożenia w stałym czasie. Grafika włókien zachowuje dotychczasowy wygląd, ale jej siatka delikatnie się deformuje. Wspólne współrzędne krawędzi zapobiegają rozchodzeniu się fragmentów; nie potrzeba wielkich buforów filtrów ani ponownego rasteryzowania każdej klatki.

Odległe mapy zachowują stan, ale ich ciała fizyczne i AI nie są aktywne. Grafika skał jest tworzona w otoczeniu kamery i usuwana po opuszczeniu dodatkowego zapasu, aby ograniczyć ciągłe odtwarzanie na brzegu kadru. Zapas tekstur anomalii zmniejszono ze 128 do 64 pikseli przy zachowaniu rozdzielczości. Siatki anomalii jawnie niszczą geometrię i bufory GPU — samo `MeshPlane.destroy()` w Pixi ich nie zwalnia.

Profil powtarzanej trasy wykrył duży dodatkowy koszt przy starcie z powierzchni: szerokie ujęcie kamery zlecało tysiące orbitalnych fragmentów anomalii. Nie są one przygotowywane podczas animacji powierzchniowej, a pierwsza klatka po jej końcu korzysta z normalnej skali orbitalnej, zamiast pozostałej skali globu. Zmiana ta nie ukrywa anomalii podczas orbitalnych przelotów śluzami.

ESC ma osobny panel narzędzi: techniczny powrót do bazy, wybór dowolnego sektora i powrót do zwykłej kampanii. Wybór sektora kopiuje kampanię do osobnego zapisu `asteroids.development.v1`. Flaga testowa omija blokady między sektorami, bez nadawania ukończonych zadań. Powrót korzysta z rozliczenia wyprawy i zwalnia scenę, fizykę, HUD oraz dźwięki.

Prospector ma zerową szansę zachowania kadłuba po utracie sygnału, niezależnie od poziomu pancerza. Losowanie kapsuły pilota pozostaje niezależne. Wczytanie starych sygnałów usuwa wrak utraconego Prospectora, zachowuje kapsułę i nie przyznaje zwrotu materiałów; pusty sygnał oraz wskazujące go zlecenie ratunkowe są porządkowane.

## Weryfikacja

125 testów zakresu zmian przechodzi. Obejmują wymagany fizyczny moduł, opcjonalność wraków, dobór celu HUD, drożność i różnorodność labiryntu, zgodność grafiki z polem zagrożenia, ciągłość radaru, widoczność obu końców śluzy, ograniczenie aktywnych map i grafiki, zwalnianie bitmap oraz buforów siatki, izolację zapisów testowych oraz powtarzane utraty startera i migrację jego starych sygnałów. Osobny test sprawdza rozmiar okna anomalii w pierwszej klatce po starcie z Fobosa. Wyniki znajdują się w `dist/verify127-results.txt`.

W przeglądarce wykonano trzy obiegi Mars → orbita Fobosa → powierzchnia → orbita → asteroida → Fobos → Mars. P95 czasu pracy po kolejnych powrotach wynosił 9.1, 8.9 i 8.7 ms; liczba ciał pozostała stała, a zamknięcie sceny zwróciło liczniki bitmap i workerów do zera. Dane pośredniej wersji: `dist/mars127-profile-final.json`. Nie jest to pomiar FPS: przeglądarka w tle miała duże odstępy między wywołaniami klatek. Po wykryciu pojedynczego skoku 304 ms na końcu startu poprawiono dobór skali pierwszej klatki; osiem końcowych prób tej klatki miało czas pracy 15.7–35.5 ms i nie tworzyło ogromnego okna fragmentów (`dist/mars127-ascent-final.json`). To lokalna weryfikacja konkretnego scenariusza, nie dowód braku wszystkich problemów długich sesji.

W interfejsie sprawdzono wylot, techniczny powrót bez utraty statku, wybór Plutona bez wcześniejszych etapów oraz odtworzenie zwykłej kampanii. Kontrola typów, ESLint i kompilacja wydania przechodzą.

Pełny zestaw uruchomiony w trakcie prac zgłaszał 114 błędów. Porównanie z osobnym archiwum HEAD wykazało te same wcześniejsze problemy: HEAD ma 115 błędów, bez nowych nazw błędnych testów w porównywanym uruchomieniu. Jedyny usunięty błąd dotyczył ciągłości fizycznego holu podczas podejścia księżycowego. Wyniki: `dist/all127-results.txt`, `dist/baseline127-results.txt`, `dist/baseline127-comparison.json`. Zestaw historyczny wymaga osobnego dostosowania m.in. dawnych założeń kampanii i receptur; nie jest w całości zielony.
