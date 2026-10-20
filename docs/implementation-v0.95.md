# Wdrożenie 0.95 — zadania, produkcja i panel pokładu

Pierwsza dostawa na Księżyc ma jedną kartę „Wyposażenie stacji”. Lista pokazuje dostarczone/wymagane: 8 poszyć stalowych I, 4 maszynerie I, 3 elektroniki I, 2 układy zasilania I i 2 podtrzymywania życia I. Liczniki poszczególnych modułów pozostają wewnętrznymi krokami budowy. Nie są osobnymi zadaniami w dzienniku ani HUD i nie generują pięciu komunikatów ukończenia. Pełna dostawa zamyka jedno zadanie; częściowe dostawy pozostają zapisane.

Karty w bazie zajmują całą szerokość lewej kolumny, po dwie na stronę. Tytuł, opis, lista wymagań, nagroda i akcja mają osobne miejsca. Pierwsze zaopatrzenie i rozbudowa prowadzą do panelu stacji, a ulepszenie statku do Hangaru. Historia nawigacji zapewnia Powrót do tej samej strony zadań. Przy składnikach dostawy oraz kosztach zaplecza, tarcz i dronów są przyciski Stwórz. Można przejść do Warsztatu, następnie do receptury składnika w Laboratorium i wracać kolejnymi krokami do miejsca wyjścia.

Instruktor oczekuje z boku wejścia śluzy. Sprawdzanie trasy hipernapędu pomija jego collider zarówno przed ładowaniem, jak i podczas przelotu. Pozostałe przeszkody nadal blokują trasę lub powodują kolizję.

HUD zachowuje kadłub, tarczę i kolorowy pasek ładowni. Usunięto górny opis zebranych surowców, przełączników i statusy towarzyszy oraz stały komunikat o hipernapędzie. Pierwsze zaopatrzenie pokazuje listę surowców z ilością w magazynie plus na statku oraz wymaganiem. Lista wyposażenia księżycowego pokazuje dostawy. Wysokość wpisu celu dostosowuje się do jego checklisty.

Panel Tab ma osobne kolumny statku i pilota, ładowni oraz celów wyprawy. Zasoby mają kafelki z ikoną, nazwą, ilością i przyciskiem Wyrzuć 1. Dłuższa lista jest stronicowana. Wyrzucenie odejmuje dokładnie jedną sztukę i tworzy ją w kosmosie. Wyłącza zbieranie, aby wyrzucony przedmiot nie wrócił natychmiast; zbieranie można wznowić przełącznikiem w Tab. Usunięto sterowanie X, O i niepotrzebny wybór zasobu B. Zniknęły stare bloki objaśnień, puste informacje o prototypach i odzysku oraz ściśnięta lista parametrów.

Zwiększono liczbę złóż miedzi i krzemu w początkowym obszarze. Małe fragmenty dostarczają po trzy porcje Cu lub Si zamiast jednej. Zawartość nadal wylicza się raz i zachowuje podczas dzielenia skał.

Weryfikacja celowana: instruktor na trasie śluzy, częściowa i pełna dostawa jednego zadania, receptury pięciu części do montażu, wyrzucanie jednej sztuki i dostępność Cu/Si. Sprawdzono również zakończenie budowy księżycowej z atakiem i odblokowaniem Marsa. W przeglądarce obejrzano karty zadań, jedną dostawę, koszty stacji, HUD i Tab; przeklikano powrót przez Warsztat i Laboratorium oraz wyrzucono jedną sztukę miedzi. Typecheck i build przechodzą. Bez pełnej regresji.

Wersja aplikacji 0.95.0, kampanii 63, dziennika 28. Starsze zapisy odrzucane bez migracji zgodnie z wcześniejszym ustaleniem.
