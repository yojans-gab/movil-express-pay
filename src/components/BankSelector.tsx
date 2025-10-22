import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, CreditCard } from 'lucide-react';

interface BankSelectorProps {
  onBankSelect: (bankName: string) => void;
  triggerText?: string;
  triggerVariant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  triggerSize?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

const BankSelector: React.FC<BankSelectorProps> = ({
  onBankSelect,
  triggerText = 'Proceder al Pago',
  triggerVariant = 'default',
  triggerSize = 'default',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleBankSelection = (bankName: string) => {
    onBankSelect(bankName);
    setIsOpen(false);
    console.log(`Banco seleccionado: ${bankName}`);
  };

  const banks = [
    {
      name: 'Banco Tikal',
      description: 'Procesamiento seguro con Banco Tikal',
      icon: Building2,
    },
    {
      name: 'Banco Kabzin',
      description: 'Procesamiento seguro con Banco Kabzin',
      icon: CreditCard,
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={triggerVariant}
          size={triggerSize}
          className={className}
        >
          {triggerText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Seleccionar Banco</DialogTitle>
          <DialogDescription>
            Elige el banco con el que deseas procesar tu pago
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {banks.map((bank) => {
            const IconComponent = bank.icon;
            return (
              <Card
                key={bank.name}
                className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
                onClick={() => handleBankSelection(bank.name)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <IconComponent className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-semibold text-lg">{bank.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {bank.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BankSelector;