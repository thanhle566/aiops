import { Fragment, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  useForm,
  Controller,
  SubmitHandler,
  FieldValues,
} from "react-hook-form";
import { Text, Button, TextInput, Callout, Badge } from "@tremor/react";
import { IoMdClose } from "react-icons/io";
import { Role } from "@/app/(keep)/settings/models";
import { KeepApiError } from "@/shared/api";
import { useApi } from "@/shared/lib/hooks/useApi";

interface RoleSidebarProps {
  isOpen: boolean;
  toggle: VoidFunction;
  selectedRole: Role | null;
  resources: string[];
  mutateRoles: () => void;
}

const RoleSidebar = ({
  isOpen,
  toggle,
  selectedRole,
  resources,
  mutateRoles,
}: RoleSidebarProps) => {
  const api = useApi();
  const {
    control,
    handleSubmit,
    setValue,
    reset,
    setError,
    formState: { errors },
    clearErrors,
  } = useForm({
    defaultValues: {
      name: selectedRole?.name || "",
      description: selectedRole?.description || "",
    },
  });

  const [newRoleScopes, setNewRoleScopes] = useState<{ [key: string]: any }>(
    {}
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && selectedRole) {
      setValue("name", selectedRole.name);
      setValue("description", selectedRole.description);
      const roleScopes = selectedRole.scopes.reduce(
        (acc: any, scope: string) => {
          const [action, resource] = scope.split(":");
          if (!acc[resource]) acc[resource] = {};
          acc[resource][action] = true;
          return acc;
        },
        {}
      );
      setNewRoleScopes(roleScopes);
    }
  }, [selectedRole, setValue, isOpen]);

  useEffect(() => {
    if (isOpen && !selectedRole) {
      reset({
        name: "",
        description: "",
      });
      setNewRoleScopes({});
    }
  }, [isOpen, selectedRole, reset]);

  const handleToggle = () => {
    if (isOpen) {
      clearErrors();
    }
    toggle();
  };

  const prepopulateScopes = () => {
    return resources.map((resource) => (
      <Fragment key={resource}>
        <Text>{resource}</Text>
        {["read", "write", "delete", "update"].map((action) => (
          <div
            key={action}
            className={`flex items-center justify-center cursor-pointer ${
              newRoleScopes[resource]?.[action]
                ? "text-green-500"
                : "text-gray-300"
            }`}
            onClick={() => {
              if (!selectedRole || !selectedRole.predefined) {
                setNewRoleScopes((prev) => ({
                  ...prev,
                  [resource]: {
                    ...prev[resource],
                    [action]: !prev[resource]?.[action],
                  },
                }));
              }
            }}
          >
            {newRoleScopes[resource]?.[action] ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
          </div>
        ))}
      </Fragment>
    ));
  };

  const onSubmit: SubmitHandler<FieldValues> = async (data) => {
    setIsSubmitting(true);
    clearErrors();
    try {
      const newRole = {
        ...data,
        scopes: Object.entries(newRoleScopes)
          .filter(([_, actions]) => Object.values(actions).some(Boolean))
          .flatMap(([resource, actions]) =>
            Object.entries(actions)
              .filter(([_, value]) => value)
              .map(([action, _]) => `${action}:${resource}`)
          ),
      };
      const response = selectedRole
        ? await api.put(`/auth/roles/${selectedRole.id}`, newRole)
        : await api.post("/auth/roles", newRole);

      console.log("Role saved:", newRole);
      reset();
      handleToggle();
      await mutateRoles();
    } catch (error) {
      if (error instanceof KeepApiError) {
        setError("root.serverError", {
          type: "manual",
          message: error.message || "Failed to save role",
        });
      } else {
        setError("root.serverError", {
          type: "manual",
          message: "An unexpected error occurred",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog onClose={handleToggle}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        </Transition.Child>
        <Transition.Child
          as={Fragment}
          enter="transition ease-in-out duration-300 transform"
          enterFrom="translate-x-full"
          enterTo="translate-x-0"
          leave="transition ease-in-out duration-300 transform"
          leaveFrom="translate-x-0"
          leaveTo="translate-x-full"
        >
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-3xl max-h-[90vh] bg-white shadow-xl overflow-auto">
              <div className="flex justify-between mb-4">
                <Dialog.Title className="text-3xl font-bold" as={Text}>
                  {selectedRole ? "Edit Role" : "Add Role"}
                  {/* <Badge className="ml-4"  color="red">
                    Beta
                  </Badge> */}
                  {selectedRole && selectedRole.predefined && (
                    <Badge className="ml-2"  color="red">
                      Predefined Role
                    </Badge>
                  )}
                </Dialog.Title>
                <Button onClick={toggle} variant="light">
                  <IoMdClose className="h-6 w-6 text-gray-500" />
                </Button>
              </div>
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="mt-4 flex flex-col h-full"
              >
                <div className="flex-grow">
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Role Name
                    </label>
                    <Controller
                      name="name"
                      control={control}
                      rules={{ required: "Role name is required" }}
                      render={({ field }) => (
                        <TextInput
                          {...field}
                          error={!!errors.name}
                          errorMessage={errors.name?.message}
                          disabled={!!(selectedRole && selectedRole.predefined)}
                          className={`${
                            selectedRole && selectedRole.predefined
                              ? "bg-gray-200"
                              : ""
                          }`}
                        />
                      )}
                    />
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <Controller
                      name="description"
                      control={control}
                      rules={{ required: "Description is required" }}
                      render={({ field }) => (
                        <TextInput
                          {...field}
                          error={!!errors.description}
                          errorMessage={errors.description?.message}
                          disabled={!!(selectedRole && selectedRole.predefined)}
                          className={`${
                            selectedRole && selectedRole.predefined
                              ? "bg-gray-200"
                              : ""
                          }`}
                        />
                      )}
                    />
                  </div>
                  <div className="mt-4">
                    <Text>Scopes</Text>
                    <div className="grid grid-cols-5 gap-4 mt-2">
                      <div></div>
                      <Text>Read</Text>
                      <Text>Write</Text>
                      <Text>Delete</Text>
                      <Text>Update</Text>
                      {prepopulateScopes()}
                    </div>
                  </div>
                  {errors.root?.serverError &&
                    typeof errors.root.serverError.message === "string" && (
                      <Callout
                        className="mt-4"
                        title="Error while adding role"
                        color="rose"
                      >
                        {errors.root.serverError.message}
                      </Callout>
                    )}
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <Button
                    variant="secondary"
                    onClick={(e) => {
                      e.preventDefault(); // Prevent form submission
                      reset();
                      handleToggle();
                    }}
                    className="btn-secondary border border-[#2C4A4B] text-[#2C4A4B]"
                  >
                    Cancel
                  </Button>
                  {!selectedRole?.predefined && (
                    <Button
                      className="btn-primary"
                      type="submit"
                      disabled={
                        isSubmitting ||
                        !Object.values(newRoleScopes).some((scope) =>
                          Object.values(scope).some(Boolean)
                        )
                      }
                      title={
                        !newRoleScopes
                          ? "At least one scope must be selected"
                          : ""
                      }
                    >
                      {isSubmitting ? "Saving..." : "Save Role"}
                    </Button>
                  )}
                </div>
              </form>
            </Dialog.Panel>
          </div>
        </Transition.Child>
      </Dialog>
    </Transition>
  );
};

export default RoleSidebar;
