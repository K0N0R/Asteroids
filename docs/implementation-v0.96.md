# Wdrożenie 0.96 — domknięcie pierwszego zadania i lifting informacji

Pierwsze zaopatrzenie kończy się dopiero po zbudowaniu zaplecza I. Wewnętrzny krok zapisuje zebranie kompletu surowców bez nagrody, zachowując stan checklisty po przetworzeniu materiałów w części. Rozbudowa przyznaje jednorazowo 40 PD. Dawne osobne Zaplecze stacji jest wewnętrznym krokiem i nie występuje jako druga karta. Budowa nie wymaga wcześniejszej synchronizacji satelity.

Dziennik ma zakładki Aktywne i Ukończone, osobne liczniki i stronicowanie. Domyślnie pokazuje aktywne cele. Ukończone zadania pokazują potwierdzenie i nagrodę, bez przycisku ponownego wykonywania. Usunięto tekst pod kartami, informację o budowie Swifta z opisu odzysku satelitów oraz wzmianki o K jako wskazaniu śluzy.

Panel modułów Hangaru pokazuje nazwę wybranego ulepszenia, duże porównanie parametrów przed/po i pełny opis wszystkich efektów. Koszt ma ikony oraz stan/wymaganie części. Blok szczegółów jest oddzielony od listy modułów i dolnych akcji statku. Zdrowie w HUD ma kolor czerwony, a tarcza niebieski; przesunięto ikonę, wartość i pasek tarczy, by nie nachodziły na pasek kadłuba.

Raport udanego powrotu pokazuje do ośmiu kafelków surowców na stronę. Każdy zawiera wspólną ikonę, nazwę i przyrost → obecny stan magazynu. PD i awans pozostają nad powrotem do bazy. Zwykłe przekazanie zasobów nie uruchamia już komunikatu radiowego Oficer operacyjnej. Usunięto wiadomość instruktora o szukaniu drogi wokół skał.

Zmieniono dwie wspólne ilustracje części: przewodniki są zwojem kabla, a moduł osłonowy sześciokątnym generatorem z rdzeniem. Elektronika pozostaje płytką z układem, a podtrzymywanie życia zbiornikami. Zmiana działa w recepturach i wszędzie, gdzie wykorzystywane są ikony tych części.

Pięć celowanych sprawdzeń początkowych zadań potwierdza brak ukończenia za surowce, rzeczywistą produkcję i montaż, jednorazowe 40 PD, zachowanie zapisu oraz niezależne nagrody satelity i ulepszenia statku. W przeglądarce sprawdzono stan po zebraniu materiałów i po rozbudowie, obie zakładki, szczegóły modułu, HUD, kafelki raportu i rozróżnienie czterech ikon. Bez pełnej regresji.

Wersja aplikacji 0.96.0, kampanii 64, dziennika 29. Starsze zapisy odrzucane bez migracji zgodnie z wcześniejszym ustaleniem.

Przy każdej części kosztu ulepszenia statku dodano Stwórz. Skrót otwiera recepturę tej części; historia działa również przez składniki w Laboratorium i wraca do tego samego statku, zakładki Ulepszenia i wybranego modułu. Sprawdzono w przeglądarce przejście Hangar → Elektronika → Oczyszczanie krzemu → Elektronika → Hangar. Format zapisu pozostaje bez zmian.

Rozróżniono również układ zasilania, maszynerię i zespół napędowy: przedstawiają odpowiednio baterię z błyskawicą, parę kół zębatych i dyszę silnika z płomieniem. Podtrzymywanie życia zachowuje zbiorniki. Wspólne ilustracje sprawdzono w przeglądarce w dużym rozmiarze oraz ikonach 32 i 56 px. Zmiana graficzna nie zmienia formatu zapisu.

## Refaktor kart zadań w bazie

Wspólny komponent `questCard` zastępuje stałe boxy 210 px. Wysokość wynika z pomiaru tekstu, listy wymagań, przycisków i nagrody; stronicowanie pakuje całe karty do dostępnych 438 px. Dłuższe dostawy otrzymują własną stronę. Karty mają 24 px marginesów, osobny panel wymagań z ikonami zasobów, większy tekst i stopkę nagrody oddzieloną linią. Skróty do produkcji, rozbudowy oraz Hangaru zachowują historię powrotu.

Typ zadania wskazuje ikona obok tytułu: turkusowy romb oznacza zadanie główne, złota gwiazda dodatkowe. Najechanie pokazuje nazwę typu. Ukończone karty pokazują tytuł, potwierdzenie i nagrodę bez powtórzonego opisu oraz akcji.

W przeglądarce sprawdzono start, dwie krótsze karty na stronie, pięć części dostawy księżycowej, zakładkę ukończonych oraz przejście do receptury i powrót na tę samą stronę. Pomiar wszystkich 81 widocznych definicji zadań wykazał maksymalnie 400 px; żadna nie przekracza obszaru strony. Kontrola typów, lint zmienionych plików i build; bez pełnej regresji. Format kampanii i dziennika bez zmian.

Usunięto wybór 1 / 5 / 10 / MAKS. z Laboratorium i Warsztatu. Podgląd kosztów, wynik oraz przycisk Wytwórz dotyczą jednej porcji receptury. Sprawdzono oba widoki i wywołanie produkcji z jedną porcją; typecheck, lint pliku i build przeszły.
