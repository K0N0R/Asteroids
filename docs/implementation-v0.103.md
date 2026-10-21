# Wdrożenie 0.103 — geografia globów

Dawne przypadkowe plamy lądu Ziemi zastąpiono uproszczonymi obrysami kontynentów zapisanymi jako długość i szerokość geograficzna. Rzut ortograficzny ma środek nad Atlantykiem (25°W, 12°N): Ameryki po lewej, Europa i Afryka po prawej, Grenlandia na północy. Próbkowanie krawędzi i przycięcie do horyzontu nie pozwala wyświetlać niewidocznej półkuli przez glob. Zarys jest ilustracyjny, nie stanowi dokładnego atlasu geodezyjnego. Ląd uzupełniają uproszczone kolory Sahary, Amazonii i lodu.

Białe chmury są osobną warstwą wewnątrz maski globu. Przesuwają się o 0,8 jednostki lokalnej na sekundę i zapętlają bez zmiany kontynentów. Cała Ziemia nie jest już zamrażana w jednej teksturze: buforowany jest tylko nieruchomy teren. Animacja korzysta z istniejących aktualizacji tła i lobby, bez dodatkowych timerów, generowania geometrii w każdej klatce ani przebudowy tekstur. Działa w bazie, podczas lotu i na mapie Układu Słonecznego. Księżyc i pozostałe statyczne globy zachowują buforowanie całości.

Księżyc ma stały, schematyczny układ dziewięciu mórz i Oceanu Burz, m.in. Morza Deszczów, Jasności, Spokoju, Przesileń, Obfitości, Nektaru, Chmur i Wilgoci. Dziesięć wyróżnionych kraterów obejmuje Tycho, Kopernika, Keplera, Arystarcha, Platona i Claviusa. Jaśniejsze obrzeża, ciemniejsze dna i delikatne promienie wyrzutowe zastępują dawne dwanaście losowych, jednakowych owalnych plam. Wspólny rysunek terenu jest wykorzystywany również przez widok powierzchni. Kolory i formy pozostają uproszczone, zgodnie z kierunkiem graficznym gry.

Ziemia i Księżyc mają łagodniejszy cień przy krawędzi zamiast prostego podziału tarczy na pół. Nie zmieniono skali, odległości, masek świata, kolizji, lokalizacji celów ani parametrów paralaksy.

Weryfikacja: osiem celowanych testów projekcji, ukrywania przeciwnej półkuli, ograniczenia geografii do tarczy, oddzielnego i zapętlonego dryfu chmur, aktualizacji czasu przez tło, istniejącej paralaksy i wyboru sektorów. Podgląd przeglądarkowy w dużej skali i porównanie chmur po 30 sekundach; kontrola typów, lint i build. Bez pełnej regresji.

Aplikacja 0.103.0, format kampanii 65 i dziennika 29 bez zmian.


## Drobny lifting kosztów rozbudowy

Części mają osobne, przygaszone kafelki w dwóch kolumnach, z większym odstępem między wierszami (52 zamiast 36), osobnym miejscem na nazwę, licznik i przycisk Stwórz. Sekcję podniesiono, aby ostatni wiersz nie dochodził do akcji montażu. Układ zastosowano do zaplecza, tarczy i dronów; w dronach skorygowano też położenie opisu i komunikatu blokady. Sprawdzono wizualnie wszystkie trzy zakładki, kontrolę typów, lint i build. Bez zmian w kosztach i mechanice.


## Zaokrąglenie linii brzegowej

Obrysy kontynentów i regionów lądu (Sahara, Amazonia) są wygładzane trzema przebiegami obcinania narożników przed projekcją geograficzną. Dzięki temu gęste próbki rzutu nie zachowują dawnych ostrych załamań, a kontynenty mają łagodne kontury. Zachowano środek projekcji, maskę globu i niezależny dryf chmur. Sprawdzono duży podgląd Ziemi, testy geografii, kontrolę typów, lint i build.
