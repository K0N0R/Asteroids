# 0.111 — lifting Jowisza

Moduł `jupiterAtmosphere.ts` zastępuje proste poziome paski i dwie elipsy dawnej plamy statyczną ilustracją warstw atmosfery. Kremowe strefy przeplatają się z ochrowymi i rdzawymi pasami o nierównych brzegach. Wewnątrz są cienkie pofałdowane smugi, mniejsze wiry i białe owale. Partie polarne mają ciemniejszą barwę oraz węższe pasma.

Wielka Czerwona Plama ma osobne warstwy koloru i eliptyczny wir. Sąsiedni strumień chmur zakrzywia się nad burzą, zamiast przechodzić pod nią prostą linią. Cień na globie otrzymał zakrzywioną granicę. Zachowano styl płaskiej, uproszczonej ilustracji na podstawie referencji autora.

Wspólny `planetView('jupiter')` aktualizuje mapę Układu Słonecznego, bazę i tło lotu. Promień, paralaksa, rozmieszczenie sektora, misje i fizyka pozostają bez zmian. Ilustracja nadal korzysta z cache tekstury i nie generuje geometrii co klatkę. Format kampanii 66 i dziennika 29 bez zmian.

Weryfikacja: podgląd dużej i małej grafiki w osobnej karcie przeglądarki; cztery istniejące testy warstwy planet i paralaksy; typecheck, lint zmienionych modułów i build release.
