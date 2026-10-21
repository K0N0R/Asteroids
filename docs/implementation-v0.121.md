# 0.121 — orbity i powierzchnie Fobosa oraz Deimosa

Fobos i Deimos mają podejścia orbitalne powiązane z grafikami księżyców. Dotychczasowy zwykły przelot do obszaru „powierzchni Fobosa” zastępuje przejście takie jak na Księżycu: zatrzymanie przy znaczniku, E przez 2 sekundy, animacja zejścia, osobny obszar powierzchni i analogiczny powrót na orbitę. Hipernapęd pozostaje dostępny wyłącznie na orbicie. Przytrzymanie E nie odbija automatycznie statku między obszarami.

Fobos zachowuje fabularne odblokowanie trasy po tarczach i rozpoznaniu bariery Marsa oraz lądowanie po pokonaniu trzech jednostek zasadzki. Instalacja, ciche włamanie, alarm, posiłki, złoża i moduł pamięci działają na jego powierzchni. Zwykły lot do współrzędnych powierzchni nie omija lądowania. Holowany moduł przechodzi razem ze statkiem i nadal wymaga fizycznego dostarczenia do Satuk 15.

Deimos ma własną grafikę orbitalną, podejście, powierzchnię i wyjście. Nie ma jeszcze nowych zadań ani instalacji. Jego dostępność zastępuje wcześniejsze założenie planu v0.4 o całkowitym odcięciu Deimosa w akcie II — zgodnie z nowym poleceniem autora. Podejście tymczasowo przeniesiono poza dotychczasową anomalię, na (-5200, -1700); docelowy układ sektora nadal może być zmieniony. Fobos zachowuje współrzędne istniejących instalacji i modułu pamięci. Oba przejścia są dostępne również przy późniejszym powrocie na Marsa.

Radar, cele nawigacji, środek obszaru, granice lotu, animacja kamery i napisy przejścia korzystają z właściwego księżyca. Grafika orbitalna księżyca jest ukrywana podczas przekazania do renderera powierzchni. Na orbicie nie ma już osobnej strefy radarowej ani trasy sugerującej swobodny przelot nad grunt Fobosa.

Zapis kampanii obsługuje pobyt na obu powierzchniach. Po utracie statku sygnał kapsuły/wraku pozostaje przy właściwym księżycu, zamiast być przenoszony na Księżyc Ziemi; opis ratunku uwzględnia nazwę ciała. Nie zmieniono numeru formatu ani dotychczasowych współrzędnych fabularnego modułu pamięci.

## Weryfikacja

67 testów Marsa, grafiki ciał niebieskich, ładowni, pamięci renderera, wydobycia, podglądów modułów, hipernapędu i receptur przechodzi. Nowe testy wykonują faktyczne zejście i powrót dla obu księżyców, sprawdzają blokadę lądowania Fobosa, zachowanie holowanego modułu, zasobów i uszkodzeń oraz zapis i ratunek na właściwej powierzchni. Dostosowano wcześniejsze założenia testowe o braku jakichkolwiek śluz na początkowym Marsie i niedozwolonym ładunku 41 porcji (bazowa ładownia od 0.120 ma 50).

Szersza próba obejmująca 17 testów Księżyca: 83/84 przechodzą. Jeden błąd oczekiwanej skali holu podczas animacji księżycowej występuje także przy kompilacji niezmienionego HEAD (`dist/baseline121-moon-results.txt`); nie jest nową regresją tej zmiany. Rzeczywiste przejścia, blokady, zachowanie ładunku i holu w symulacji przechodzą. Pozostaje to osobnym znanym problemem renderowania.

Sprawdzono w osobnej karcie przeglądarki podglądy orbit i powierzchni obu księżyców. Robocze zrzuty: `dist/mars121-phobos-surface.png`, `dist/mars121-deimos-surface.png`, `dist/mars121-deimos-orbit.png`.
