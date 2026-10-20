# Wdrożenie 0.94 — pierwszy układ i odzyskiwanie grafiki

Księżyc znajduje się 8,5 km od środka obszaru Ziemi zamiast 4,5 km. Śluza kończy się 600 m przed wejściem nad powierzchnię. Sonda i śluza bogatej asteroidy są zakotwiczone względem orbity Księżyca. Świat po synchronizacji satelity ma promień 12 km, a trasy śluz dopuszczają 8 km. Domyślny zasięg skoku poza śluzą pozostaje 4 km. Sygnały ratunkowe uwzględniają rzeczywisty rozmiar sektora.

Usunięto opcjonalny dawny ratunek Swifta oraz dodawanie jego dwóch patrolowców. Swift nadal pochodzi z opcjonalnego odzysku trzech satelitów. Test obejmuje świeży start, synchronizację obu obiektów i ponowny wylot; przeciwnicy nie pojawiają się przed odbiorem stacji księżycowej. Odbiór stacji nadal uruchamia atak, a zwycięstwo otwiera Marsa.

Satelity mają różne pozycje, rotacje i znaki prędkości kątowej. Podczas ładowania skoku statek obraca się płynnie, a hol ustawia za nim. Podczas przelotu oba obiekty przesuwają się o tę samą odległość; pozycja poprzedniej klatki holu nie jest nadpisywana po przesunięciu. Zwykłe naciąganie liny jest na ten czas wyłączone. Tło orbitalne korzysta z interpolowanej pozycji statku.

Podczas podejścia do Księżyca odległa ilustracja Księżyca ustępuje rendererowi powierzchni. Pozostałe ciała, w tym Ziemia, pozostają w warstwie odległego tła. Warstwa nadal obsługuje listę dowolnej liczby ciał.

Napisy miały już podwójny rozmiar fontu i skalę 0,5, a dodatkowo dziedziczyły DPR renderera. Ustawienie rozdzielczości ich tekstur na 1 zachowuje dwukrotne próbkowanie i zmniejsza zużycie pamięci tekstur na ekranach o DPR 2 do jednej czwartej. Po utracie kontekstu WebGL zegar symulacji zatrzymuje się. Po odzyskaniu napisy są rasteryzowane ponownie, geometria odświeżana, a kontenery buforowane do tekstury odrysowywane. To ostatnie jest konieczne dla globów, których zawartość GPU przepada po utracie kontekstu.

Weryfikacja: 19 celowanych scenariuszy obejmujących Akt I, śluzy, hol, warstwę ciał i odzyskiwanie grafiki, typecheck oraz build. Próba w rzeczywistym WebGL wymusiła utratę i odzyskanie kontekstu: 12 statycznych napisów i Ziemia wróciły, animacja wznowiła działanie. Ziemia pozostała widoczna po przełączeniu na podejście. Spontanicznego zawieszenia podczas zwykłej gry nie odtworzono, więc dokładna przyczyna pierwotnego zgłoszenia pozostaje niepotwierdzona. Bez pełnej regresji.

Wersja aplikacji 0.94.0, kampanii 62, dziennika 27. Starsze zapisy są odrzucane bez migracji zgodnie z dotychczasowym ustaleniem.
