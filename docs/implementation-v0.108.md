# 0.108 — grafiki układu Marsa

Mars otrzymał nową warstwę ilustracji we wspólnej stylistyce wektorowej: rdzawo-pomarańczowe równiny, większe zaokrąglone plamy terenu, rozgałęziony kanion z ciemnym dnem, formacje wulkaniczne, duży basen, drobniejsze kratery oraz jasne czapy polarne. Zastąpiło to losowe kratery i prostokątny pas. Zakrzywiony cień ma ciepłą barwę. Grafika jest stylizowanym atlasem, nie mapą geologiczną w wiernym rzucie.

Fobos ma jaśniejszą beżową powierzchnię, nieregularny obrys, duży krater i bruzdy. Deimos ma ciemniejszy szarobrązowy kolor, bardziej obłą, ale asymetryczną sylwetkę oraz inny zestaw mniejszych kraterów i zagłębień. Ilustracje nawiązują do referencji autora i zachowują odrębne cechy także w małej skali. Nie dodano atmosferycznych otoczek księżycom.

## Użycie grafik i późniejsze ustawienie sektora

- `planetView('mars')` używa nowego Marsa we wszystkich dotychczasowych widokach, także na mapie Układu Słonecznego i w bazie.
- `planetView('phobos')` i `planetView('deimos')` udostępniają niezależne ilustracje księżyców.
- `marsMoonView(id)` udostępnia sam obrys i powierzchnię księżyca do dalszego wykorzystania.
- `MARS_SYSTEM_PREVIEW_BODIES` w `frontend/game/worlds/celestialBodies.ts` grupuje tymczasowe kotwice, paralaksę i skale trzech obiektów.

Fobos jest w tymczasowym kadrze bliżej Marsa i większy niż Deimos. Parametry służą wyłącznie prezentacji. Dokładne rozmieszczenie i rozkład sektora autor określi później. Nie dodano punktów nawigacyjnych, kolizji, śluz, powierzchni grywalnych ani zadań księżyców. Nie zmieniono istniejącej geometrii misji marsjańskich ani zapisów gry (kampania 66, dziennik 29).

## Weryfikacja

Cztery testy warstwy ciał niebieskich obejmują dotychczasową Ziemię i Księżyc, trzy obiekty Marsa, osobne ilustracje jego księżyców, projekcję przy obrocie i powiększeniu kamery oraz niszczenie poprzednich widoków po zmianie sektora. Podgląd przeglądarkowy obejmuje duże ilustracje i ich osadzenie w tle lotu. Końcowe kontrole: typecheck, lint zmienionych modułów i build release.
