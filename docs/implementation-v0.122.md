# 0.122 — długi labirynt do śluzy Fobosa i silne skażenie

Dotychczasowe dwie krótkie przegrody na podejściu do Fobosa zastępuje otoczony anomalią labirynt: siedem długich odcinków i dwanaście zakrętów, z jednym wejściem i zamkniętą końcową komorą. Śluzę po stronie Marsa przeniesiono z (2400, -800) do (5200, -2800). Jej drugi koniec oraz miejsca fabularne na Fobosie pozostają bez zmian. Początek korytarza jest przy (1900, 1400).

Trasa środkowa ma ponad czterokrotną długość odcinka na wprost. Niezależne wyszukiwanie najkrótszej drogi na siatce z promieniem kadłuba potwierdza ponad 16 tys. jednostek lotu i brak skrótu przez obejście zewnętrznych ścian. Przejście ma zapas ponad 180 jednostek od anomalii na wyznaczonej linii. Skały nie są generowane w obrębie labiryntu. Włókna nadal korzystają ze wspólnej ilustracji z miękkimi granicami; nie dodano osobnych nakładających się obrazków ścian. Radar pokazuje rzeczywiste pasma, a nawigacja kieruje najpierw do wejścia, następnie wskazuje śluzę bez rysowania rozwiązania labiryntu.

Skażenie anomalią działa od razu: 15 punktów kadłuba na sekundę, czyli 1.5 × niezmienione 10 punktów/s poza granicą sektora. Pomija tarcze i ogranicza prędkość do 25 m/s, również z dopalaczem. Po wyjściu poza obrys kadłuba obrażenia ustają. Te same parametry dotyczą istniejących anomalii przy Jowiszu; zachowano próbkowanie całego odcinka lotu między klatkami. Usunięto dawny okres ochronny 0.8 s oraz pochłanianie tych obrażeń przez tarcze. Kalibrowane przeloty śluzami pozostają wolne od kolizji i skażenia podczas hipernapędu.

## Weryfikacja

79 testów przechodzi: geometria i najkrótsza droga labiryntu, faktyczny stosunek obrażeń 15/10 w symulacji, pełna tarcza, dopalacz i limit prędkości, ustanie skażenia po wyjściu, przelot śluzą Fobosa oraz dotychczasowe testy Marsa, wydobycia, receptur, hipernapędu, grafiki i sprzątania zasobów. Testy jowiszowego ratunku ponownie sprawdzają pełny lot i fizyczny hol sondy; ich dane początkowe uzupełniono o obowiązujące etapy wewnętrzne Aktu I i ukończony stan Marsa, bez osłabiania walidacji zapisów.

ESLint zmienionych plików, kontrola typów i build przechodzą. Układ rzeczywistej ilustracji anomalii sprawdzono w oddzielnej karcie przeglądarki; roboczy podgląd znajduje się w `dist/maze122-preview.png`. Nie zmieniono formatu zapisu ani numerów zadań.
