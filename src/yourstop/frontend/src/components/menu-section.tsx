import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Menu } from '@/lib/types';

interface MenuSectionProps {
  menu: Menu;
}

export function MenuSection({ menu }: MenuSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Our Menu</CardTitle>
        <CardDescription>Explore our delicious offerings.</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion
          type="single"
          collapsible
          className="w-full"
          defaultValue={menu[0]?.id}
        >
          {menu.map((category) => (
            <AccordionItem value={category.id} key={category.id}>
              <AccordionTrigger className="font-headline text-xl">
                {category.title}
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {category.items.map((item) => (
                    <div key={item.id}>
                      <div className="flex items-baseline justify-between">
                        <h4 className="font-bold">{item.name}</h4>
                        <p className="font-mono font-semibold text-primary">
                          ${item.price.toFixed(2)}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
