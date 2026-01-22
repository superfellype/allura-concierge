import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { NumericFormat } from "react-number-format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { Coupon } from "@/services/coupons.service";

const couponSchema = z.object({
  code: z
    .string()
    .min(1, "Código é obrigatório")
    .max(50, "Código muito longo")
    .transform((val) => val.toUpperCase().trim()),
  discount_type: z.enum(["percentage", "fixed"]),
  discount_value: z.number().positive("Desconto deve ser maior que zero"),
  min_order_value: z.number().min(0).optional().default(0),
  max_uses: z.number().int().positive().optional().nullable(),
  starts_at: z.string().optional().nullable(),
  expires_at: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
});

export type CouponFormValues = z.infer<typeof couponSchema>;

interface CouponFormProps {
  defaultValues?: Partial<CouponFormValues>;
  onSubmit: (data: CouponFormValues) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
  isSaving?: boolean;
}

export default function CouponForm({
  defaultValues,
  onSubmit,
  onCancel,
  isEditing = false,
  isSaving = false,
}: CouponFormProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<CouponFormValues>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: "",
      discount_type: "percentage",
      discount_value: 0,
      min_order_value: 0,
      max_uses: null,
      starts_at: null,
      expires_at: null,
      is_active: true,
      ...defaultValues,
    },
  });

  const discountType = watch("discount_type");

  const formatDateForInput = (dateStr: string | null | undefined) => {
    if (!dateStr) return "";
    try {
      return dateStr.slice(0, 16);
    } catch {
      return "";
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Code */}
      <div>
        <Label htmlFor="code" className="font-body">
          Código do Cupom
        </Label>
        <Input
          id="code"
          {...register("code")}
          placeholder="Ex: PRIMEIRACOMPRA"
          className="mt-1.5 glass-input uppercase"
        />
        {errors.code && (
          <p className="text-sm text-destructive mt-1">{errors.code.message}</p>
        )}
      </div>

      {/* Type & Value */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="discount_type" className="font-body">
            Tipo de Desconto
          </Label>
          <Controller
            name="discount_type"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="mt-1.5 glass-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                  <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div>
          <Label htmlFor="discount_value" className="font-body">
            Valor
          </Label>
          <Controller
            name="discount_value"
            control={control}
            render={({ field }) => (
              <NumericFormat
                id="discount_value"
                value={field.value}
                onValueChange={(values) => {
                  field.onChange(values.floatValue || 0);
                }}
                decimalScale={discountType === "percentage" ? 0 : 2}
                allowNegative={false}
                thousandSeparator="."
                decimalSeparator=","
                prefix={discountType === "fixed" ? "R$ " : ""}
                suffix={discountType === "percentage" ? "%" : ""}
                className="mt-1.5 w-full px-3 py-2 glass-input rounded-md"
                placeholder={discountType === "percentage" ? "10%" : "R$ 50,00"}
              />
            )}
          />
          {errors.discount_value && (
            <p className="text-sm text-destructive mt-1">
              {errors.discount_value.message}
            </p>
          )}
        </div>
      </div>

      {/* Min Order & Max Uses */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="min_order_value" className="font-body">
            Pedido Mínimo (R$)
          </Label>
          <Controller
            name="min_order_value"
            control={control}
            render={({ field }) => (
              <NumericFormat
                id="min_order_value"
                value={field.value || ""}
                onValueChange={(values) => {
                  field.onChange(values.floatValue || 0);
                }}
                decimalScale={2}
                allowNegative={false}
                thousandSeparator="."
                decimalSeparator=","
                prefix="R$ "
                className="mt-1.5 w-full px-3 py-2 glass-input rounded-md"
                placeholder="R$ 0,00"
              />
            )}
          />
        </div>
        <div>
          <Label htmlFor="max_uses" className="font-body">
            Limite de Usos
          </Label>
          <Controller
            name="max_uses"
            control={control}
            render={({ field }) => (
              <Input
                id="max_uses"
                type="number"
                min="1"
                value={field.value ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  field.onChange(val ? parseInt(val) : null);
                }}
                placeholder="Ilimitado"
                className="mt-1.5 glass-input"
              />
            )}
          />
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="starts_at" className="font-body">
            Início
          </Label>
          <Controller
            name="starts_at"
            control={control}
            render={({ field }) => (
              <Input
                id="starts_at"
                type="datetime-local"
                value={formatDateForInput(field.value)}
                onChange={(e) => {
                  field.onChange(
                    e.target.value
                      ? new Date(e.target.value).toISOString()
                      : null
                  );
                }}
                className="mt-1.5 glass-input"
              />
            )}
          />
        </div>
        <div>
          <Label htmlFor="expires_at" className="font-body">
            Expiração
          </Label>
          <Controller
            name="expires_at"
            control={control}
            render={({ field }) => (
              <Input
                id="expires_at"
                type="datetime-local"
                value={formatDateForInput(field.value)}
                onChange={(e) => {
                  field.onChange(
                    e.target.value
                      ? new Date(e.target.value).toISOString()
                      : null
                  );
                }}
                className="mt-1.5 glass-input"
              />
            )}
          />
        </div>
      </div>

      {/* Active Toggle */}
      <div className="flex items-center justify-between">
        <Label htmlFor="is_active" className="font-body">
          Ativo
        </Label>
        <Controller
          name="is_active"
          control={control}
          render={({ field }) => (
            <Switch
              id="is_active"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
      </div>

      <DialogFooter className="gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="glass-btn-secondary"
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSaving} className="glass-btn">
          {isSaving ? "Salvando..." : "Salvar"}
        </Button>
      </DialogFooter>
    </form>
  );
}
